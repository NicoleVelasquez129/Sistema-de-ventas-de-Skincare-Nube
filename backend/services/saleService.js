const { Venta, DetalleVenta, Producto, Usuario, Cliente, Pago } = require('../models');
const sequelize = require('../config/database');
const { buscarOCrearClienteService, clienteDeCuentaService } = require('./clientService')
const { Op } = require('sequelize');

async function crearVenta(idUsuario, itemsCarrito, extra = {}) {
    if (!Number.isInteger(Number(idUsuario)) || Number(idUsuario) <= 0) {
        throw new Error('La sesión no contiene un usuario válido.');
    }

    if (!Array.isArray(itemsCarrito) || itemsCarrito.length === 0) {
        throw new Error('Agrega al menos un producto al carrito.');
    }

    if (itemsCarrito.some(item => (
        !Number.isInteger(Number(item.id_producto)) ||
        Number(item.id_producto) <= 0 ||
        !Number.isInteger(Number(item.cantidad)) ||
        Number(item.cantidad) <= 0
    ))) {
        throw new Error('Los productos y cantidades del carrito no son válidos.');
    }

    const t = await sequelize.transaction();

    try {
        let subtotalGeneral = 0;
        const detallesVenta = [];

        for (const item of itemsCarrito) {
            const productoDb = await Producto.findByPk(item.id_producto, { transaction: t });

            if (!productoDb) {
                throw new Error(`Producto con ID ${item.id_producto} no encontrado`);
            }

            if (!productoDb.activo) {
                throw new Error(`El producto ${productoDb.nombre} ya no está disponible`);
            }

            if (productoDb.stock < Number(item.cantidad)) {
                throw new Error(`Stock insuficiente para el producto: ${productoDb.nombre}`);
            }

            const precioUnitario = Number(productoDb.precio);
            const cantidad = Number(item.cantidad);
            const subtotalItem = precioUnitario * cantidad;

            subtotalGeneral += subtotalItem;

            detallesVenta.push({
                id_producto: productoDb.id_producto,
                cantidad,
                precio_unitario: precioUnitario,
                costo_unitario: Number(productoDb.costo),
                subtotal: subtotalItem
            });

            productoDb.stock = Number(productoDb.stock) - cantidad;
            await productoDb.save({ transaction: t });
        }

        const costoEnvio = extra.conEnvio === false ? 0.00 : (subtotalGeneral >= 100 ? 0.00 : 15.00);
        const totalFinal = subtotalGeneral + costoEnvio;

        let idCliente = null;
        if (extra.cuentaWeb) {
            const cliente = await clienteDeCuentaService(extra.cuentaWeb, t);
            idCliente = cliente.id_cliente;
        } else if (extra.datosCliente) {
            const cliente = await buscarOCrearClienteService(extra.datosCliente, t);
            idCliente = cliente.id_cliente;
        }

        const nuevaVenta = await Venta.create({
            id_usuario: extra.idVendedor ? null : idUsuario,
            id_vendedor: extra.idVendedor || null,
            total: totalFinal,
            envio: costoEnvio,
            id_cliente: idCliente,
            direccion_entrega: extra.direccionEntrega || null,
            ubicacion_lat: extra.lat ?? null,
            ubicacion_lng: extra.lng ?? null,
            estado: 'registrada'
            
        }, { transaction: t });

        for (const detalle of detallesVenta) {
            await DetalleVenta.create({
                ...detalle,
                id_venta: nuevaVenta.id_venta
            }, { transaction: t });
        }

        await t.commit();

        return {
            success: true,
            id_venta: nuevaVenta.id_venta,
            total: totalFinal,
            envio: costoEnvio
        };
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

async function obtenerVentas() {
    return Venta.findAll({
        include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'correo'] },
            { model: Usuario, as: 'vendedor', attributes: ['nombre', 'correo'] },
            { model: DetalleVenta, as: 'detalles', include: [Producto] },
            { model: Cliente },
            { model: Pago, as: 'pagos' },
        ],
        order: [['fecha', 'DESC']],
    });
}

async function confirmarPago(idVenta, usuarioSesion, metodo) {
    if (!['efectivo', 'qr', 'transferencia'].includes(metodo)) {
        throw new Error('Elige el método de pago: efectivo, qr o transferencia.');
    }

    const t = await sequelize.transaction();
    try {
        const venta = await Venta.findByPk(idVenta, { transaction: t, lock: t.LOCK.UPDATE });

        if (!venta) {
            const e = new Error('Venta no encontrada.');
            e.status = 404;
            throw e;
        }
        const esVentaWeb = venta.id_usuario != null && venta.id_vendedor == null;
        if (usuarioSesion.rol === 'vendedor' && !esVentaWeb && venta.id_vendedor !== usuarioSesion.id_usuario) {
            const e = new Error('Solo puedes confirmar pagos de tus propias ventas.');
            e.status = 403;
            throw e;
        }
        if (venta.estado === 'anulada') throw new Error('No se puede cobrar una venta anulada.');
        if (venta.estado_pedido !== 'pendiente') throw new Error('Esta venta ya tiene el pago confirmado.');
        if (esVentaWeb && !venta.comprobante_pago) {
            throw new Error('El cliente aún no subió su comprobante de pago.');
        }

        const pago = await Pago.create({
            monto: venta.total,
            metodo,
            id_venta: venta.id_venta,
            id_usuario: usuarioSesion.id_usuario
        }, { transaction: t });

        await venta.update({
            estado_pedido: 'pagado',
            mensaje_pago: null,
            ...(esVentaWeb ? { id_vendedor: usuarioSesion.id_usuario } : {})
        }, { transaction: t });
        await t.commit();
        return pago;
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

async function obtenerVentasDeVendedor(idUsuario) {
    return Venta.findAll({
        where: { id_vendedor: idUsuario },
        include: [
            { model: Cliente },
            { model: DetalleVenta, as: 'detalles', include: [Producto] },
            { model: Pago, as: 'pagos' }
        ],
        order: [['fecha', 'DESC']]
    });
}

const VENTANA_CANCELACION_MS = 20 * 60 * 1000;

async function cancelarVenta(idVenta, usuarioSesion) {
    const t = await sequelize.transaction();
    try {
        const venta = await Venta.findByPk(idVenta, { transaction: t, lock: t.LOCK.UPDATE });
        if (!venta) {
            const e = new Error('Venta no encontrada.');
            e.status = 404;
            throw e;
        }

        const esSuVenta = venta.id_vendedor === usuarioSesion.id_usuario;
        if (!esSuVenta && usuarioSesion.rol !== 'administrador') {
            const e = new Error('Solo puedes cancelar las ventas que registraste tú.');
            e.status = 403;
            throw e;
        }

        if (venta.estado === 'anulada') throw new Error('Esta venta ya fue cancelada.');
        if (venta.estado_pedido !== 'pendiente') throw new Error('Solo se puede cancelar un pedido pendiente de pago.');
        if (Date.now() - new Date(venta.createdAt).getTime() > VENTANA_CANCELACION_MS) {
            throw new Error('Pasaron más de 20 minutos: ya no se puede cancelar esta venta.');
        }

        const detalles = await DetalleVenta.findAll({ where: { id_venta: venta.id_venta }, transaction: t });
        for (const detalle of detalles) {
            const producto = await Producto.findByPk(detalle.id_producto, { transaction: t, lock: t.LOCK.UPDATE });
            if (producto) {
                producto.stock = Number(producto.stock) + Number(detalle.cantidad);
                await producto.save({ transaction: t });
            }
        }

        await venta.update({ estado: 'anulada' }, { transaction: t });
        await t.commit();
        return { id_venta: venta.id_venta, estado: 'anulada' };
    } catch (error) {
        await t.rollback();
        throw error;
    }
}

const ATRIBUTOS_DETALLE = ['id_detalle', 'cantidad', 'precio_unitario', 'subtotal', 'id_producto'];

function buscarPedidoWeb(venta) {
    if (!venta || venta.id_usuario == null) {
        const e = new Error('Pedido en línea no encontrado.');
        e.status = 404;
        throw e;
    }
    if (venta.estado === 'anulada') throw new Error('Este pedido está anulado.');
}

async function guardarComprobante(idVenta, idUsuario, ruta) {
    const venta = await Venta.findByPk(idVenta);
    buscarPedidoWeb(venta);
    if (venta.id_usuario !== idUsuario) {
        const e = new Error('Solo puedes enviar el comprobante de tus propios pedidos.');
        e.status = 403;
        throw e;
    }
    if (venta.estado_pedido !== 'pendiente') throw new Error('Este pedido ya tiene el pago confirmado.');
    await venta.update({ comprobante_pago: ruta, mensaje_pago: null });
    return { id_venta: venta.id_venta, comprobante_pago: ruta };
}

async function obtenerPedidosDeCliente(idUsuario) {
    return Venta.findAll({
        where: { id_usuario: idUsuario },
        include: [
            { model: DetalleVenta, as: 'detalles', attributes: ATRIBUTOS_DETALLE, include: [{ model: Producto, attributes: ['nombre', 'imagen'] }] },
            { model: Pago, as: 'pagos', attributes: ['monto', 'metodo', 'fecha'] }
        ],
        order: [['fecha', 'DESC']]
    });
}

async function obtenerPedidosEnLinea(usuarioSesion) {
    const where = { id_usuario: { [Op.ne]: null } };
    if (usuarioSesion.rol === 'vendedor') {
        // Pendientes (sin vendedor aún) + los que él confirmó
        where[Op.or] = [{ id_vendedor: null }, { id_vendedor: usuarioSesion.id_usuario }];
    }
    return Venta.findAll({
        where,
        include: [
            { model: Usuario, as: 'usuario', attributes: ['nombre', 'correo'] },
            { model: Cliente },
            { model: DetalleVenta, as: 'detalles', attributes: ATRIBUTOS_DETALLE, include: [{ model: Producto, attributes: ['nombre', 'imagen'] }] },
            { model: Pago, as: 'pagos' }
        ],
        order: [['fecha', 'DESC']]
    });
}

async function rechazarPago(idVenta, mensaje) {
    const texto = typeof mensaje === 'string' ? mensaje.trim() : '';
    if (!texto || texto.length > 255) throw new Error('Escribe un mensaje para el cliente (máximo 255 caracteres).');
    const venta = await Venta.findByPk(idVenta);
    buscarPedidoWeb(venta);
    if (venta.estado_pedido !== 'pendiente') throw new Error('Este pedido ya tiene el pago confirmado.');
    await venta.update({ mensaje_pago: texto, comprobante_pago: null });
    return { id_venta: venta.id_venta, mensaje_pago: texto };
}

async function avanzarEstadoPedido(idVenta, nuevoEstado, usuarioSesion) {
    const SIGUIENTE = { pagado: 'enviado' };
    const venta = await Venta.findByPk(idVenta);
    buscarPedidoWeb(venta);
    if (usuarioSesion.rol === 'vendedor' && venta.id_vendedor !== usuarioSesion.id_usuario) {
        const e = new Error('Solo puedes enviar los pedidos que confirmaste tú.');
        e.status = 403;
        throw e;
    }
    if (SIGUIENTE[venta.estado_pedido] !== nuevoEstado) {
        throw new Error('Cambio de estado no válido. Solo se puede pasar de pagado a enviado.');
    }
    const cambios = { estado_pedido: nuevoEstado };
    await venta.update(cambios);
    return { id_venta: venta.id_venta, estado_pedido: nuevoEstado };
}

module.exports = {
    crearVenta,
    obtenerVentas,
    confirmarPago,
    cancelarVenta,
    obtenerVentasDeVendedor,
    guardarComprobante, 
    obtenerPedidosDeCliente, 
    obtenerPedidosEnLinea, 
    rechazarPago, 
    avanzarEstadoPedido
};