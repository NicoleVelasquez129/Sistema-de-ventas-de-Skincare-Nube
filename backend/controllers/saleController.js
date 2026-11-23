const { Venta, Usuario, Cliente, DetalleVenta, Producto } = require('../models');
const { crearVenta, obtenerVentas: obtenerVentasService, confirmarPago, obtenerVentasDeVendedor,cancelarVenta,
    guardarComprobante, obtenerPedidosDeCliente, obtenerPedidosEnLinea, rechazarPago, avanzarEstadoPedido } = require('../services/saleService');
const { carnetValido, direccionValida } = require('../utils/validaciones');


const registrarVenta = async (req, res) => {
    try {
        const { items, carnet, con_envio, direccion_entrega, ubicacion_lat, ubicacion_lng } = req.body || {};

        const lat = ubicacion_lat === undefined || ubicacion_lat === null ? null : Number(ubicacion_lat);
        const lng = ubicacion_lng === undefined || ubicacion_lng === null ? null : Number(ubicacion_lng);
        if ((lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) ||
            (lng !== null && (!Number.isFinite(lng) || lng < -180 || lng > 180))) {
            throw new Error('La ubicación enviada no es válida.');
        }

        const usuario = await Usuario.findByPk(req.usuario.id_usuario, { attributes: ['nombre', 'correo'] });
        if (!usuario) throw new Error('La sesión no contiene un usuario válido.');

        const direccion = typeof direccion_entrega === 'string' && direccion_entrega.trim() ? direccion_entrega.trim() : null;
        if (direccion && !direccionValida(direccion)) throw new Error('La dirección debe tener al menos 5 caracteres.');
        if (typeof carnet === 'string' && carnet.trim() && !carnetValido(carnet)) {
            throw new Error('El carnet solo puede tener letras, números y un guion (5 a 20 caracteres).');
        }
        const conEnvio = con_envio === true;

        if (!direccion && (lat === null || lng === null)) {
            throw new Error('Escribe tu dirección o usa tu ubicación actual para continuar con el pago.');
        }

        
        const resultadoVenta = await crearVenta(req.usuario.id_usuario, items, {
            datosCliente: {
                nombre: usuario.nombre,
                correo: usuario.correo,
                carnet,
                direccion
            },
            conEnvio,
            direccionEntrega: direccion,
            lat,
            lng
        });

        return res.status(201).json({
            success: true,
            mensaje: "Venta registrada con éxito y stock actualizado automáticamente",
            data: resultadoVenta
        });
    } catch (error) {
        const esErrorInterno = error instanceof TypeError || error.name?.startsWith('Sequelize');
        const mensaje = esErrorInterno
            ? 'No se pudo completar la compra por un problema del servidor. Inténtalo de nuevo.'
            : error.message || 'No se pudo procesar la compra. Revisa el carrito e inténtalo de nuevo.';
        if (esErrorInterno) console.error('Error interno al registrar la venta:', error);
        return res.status(esErrorInterno ? 500 : 400).json({
            success: false,
            mensaje,
            error: mensaje
        });

    }
};

const obtenerVentas = async (req, res) => {
    try {
        const ventas = await obtenerVentasService();
        return res.status(200).json({ 
            success: true, 
            total: ventas.length, 
            data: ventas 
        });
    } catch (error) {
        return res.status(500).json({ 
            success: false, 
            mensaje: "Error al obtener el historial de ventas", 
            error: error.message 
        });
    }
};

const { generarFacturaPDF } = require('../services/pdfService');

async function descargarFacturaPDF(req, res) {
    try {
        const idVenta = Number(req.params.id);
        const venta = await Venta.findByPk(idVenta, {
            include: [
                { model: Usuario, as: 'usuario', attributes: ['nombre', 'correo'] },
                { model: Cliente, attributes: ['nombre', 'carnet', 'telefono', 'correo'] },
                { model: DetalleVenta, as: 'detalles', include: [Producto] }
            ]
        });

        if (!venta) {
            return res.status(404).json({ mensaje: 'Venta no encontrada' });
        }
        const esSuya = venta.id_usuario === req.usuario.id_usuario || venta.id_vendedor === req.usuario.id_usuario;
        if (!esSuya && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: 'No tienes permiso para descargar esta factura.' });
        }

        if (venta.id_usuario != null && venta.estado_pedido === 'pendiente') {
            return res.status(400).json({ mensaje: 'El ticket estará disponible cuando el vendedor confirme tu pago.' });
        }

        const pdfBuffer = await generarFacturaPDF(venta);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Factura_${venta.id_venta}.pdf`);
        return res.send(pdfBuffer);

    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al generar la factura PDF', error: error.message });
    }
}

const responderError = (res, error) => {
    const esErrorInterno = error instanceof TypeError || error.name?.startsWith('Sequelize');
    const mensaje = esErrorInterno
        ? 'No se pudo completar la operación por un problema del servidor. Inténtalo de nuevo.'
        : error.message;
    if (esErrorInterno) console.error('Error interno en ventas:', error);
    const status = error.status || (esErrorInterno ? 500 : 400);
    return res.status(status).json({ success: false, mensaje, error: mensaje });
};

const registrarVentaVendedor = async (req, res) => {
    try {
        const { cliente, items } = req.body || {};
        const resultado = await crearVenta(req.usuario.id_usuario, items, {
            datosCliente: cliente,
            conEnvio: false,
            direccionEntrega: null,
            idVendedor: req.usuario.id_usuario
        });
        return res.status(201).json({ success: true, mensaje: 'Venta registrada', data: resultado });
    } catch (error) {
        return responderError(res, error);
    }
};

const registrarPago = async (req, res) => {
    try {
        const pago = await confirmarPago(req.params.id, req.usuario, req.body?.metodo);
        return res.status(201).json({ success: true, mensaje: 'Pago confirmado', data: pago });
    } catch (error) {
        return responderError(res, error);
    }
};

const obtenerMisVentas = async (req, res) => {
    try {
        const ventas = await obtenerVentasDeVendedor(req.usuario.id_usuario);
        return res.status(200).json({ success: true, total: ventas.length, data: ventas });
    } catch (error) {
        return responderError(res, error);
    }
};

const anularVenta = async (req, res) => {
    try {
        const resultado = await cancelarVenta(req.params.id, req.usuario);
        return res.status(200).json({ success: true, mensaje: 'Venta cancelada y stock devuelto', data: resultado });
    } catch (error) {
        return responderError(res, error);
    }
};
const subirComprobanteVenta = async (req, res) => {
    try {
        if (!req.file) throw new Error("Adjunta el comprobante (imagen o PDF) en el campo 'comprobante'.");
        const data = await guardarComprobante(req.params.id, req.usuario.id_usuario, `/uploads/${req.file.filename}`);
        return res.status(201).json({ success: true, mensaje: 'Comprobante enviado. El vendedor lo revisará.', data });
    } catch (error) {
        return responderError(res, error);
    }
};

const misPedidos = async (req, res) => {
    try {
        const pedidos = await obtenerPedidosDeCliente(req.usuario.id_usuario);
        return res.status(200).json({ success: true, total: pedidos.length, data: pedidos });
    } catch (error) {
        return responderError(res, error);
    }
};

const pedidosEnLinea = async (req, res) => {
    try {
        const pedidos = await obtenerPedidosEnLinea(req.usuario);
        return res.status(200).json({ success: true, total: pedidos.length, data: pedidos });
    } catch (error) {
        return responderError(res, error);
    }
};

const rechazarPagoVenta = async (req, res) => {
    try {
        const data = await rechazarPago(req.params.id, req.body?.mensaje);
        return res.status(200).json({ success: true, mensaje: 'Mensaje enviado al cliente', data });
    } catch (error) {
        return responderError(res, error);
    }
};

const cambiarEstadoPedido = async (req, res) => {
    try {
        const data = await avanzarEstadoPedido(req.params.id, req.body?.estado_pedido, req.usuario);
        return res.status(200).json({ success: true, mensaje: 'Estado actualizado', data });
    } catch (error) {
        return responderError(res, error);
    }
};

module.exports = {
    registrarVenta,
    obtenerVentas,
    descargarFacturaPDF,
    registrarVentaVendedor,
    registrarPago,
    obtenerMisVentas,
    anularVenta,
    subirComprobanteVenta, 
    misPedidos, 
    pedidosEnLinea, 
    rechazarPagoVenta, 
    cambiarEstadoPedido
};
