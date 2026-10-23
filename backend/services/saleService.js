const { Venta, DetalleVenta, Producto, Cliente } = require("../models");
const sequelize = require("../config/database");

// Lógica de negocio para registrar una venta
const crearVentaService = async (datosVenta) => {
    const { id_cliente, id_usuario, items } = datosVenta;
    const t = await sequelize.transaction();

    try {
        if (!Array.isArray(items) || items.length === 0) {
            throw new Error("La venta debe incluir al menos un producto.");
        }

        const idsProductos = items.map(i => Number(i.id_producto));
        if (new Set(idsProductos).size !== idsProductos.length) {
            throw new Error("Hay productos repetidos en la venta.");
        }

        if (id_cliente) {
            const cliente = await Cliente.findByPk(id_cliente, { transaction: t });
            if (!cliente) throw new Error("El cliente indicado no existe.");
        }
        

        let totalVenta = 0;
        const detallesCalculados = [];

        for (let item of items) {
            const idProducto = Number(item.id_producto);
            const cantidad = Number(item.cantidad);

            if (!Number.isInteger(idProducto) || idProducto <= 0) {
                throw new Error("ID de producto inválido.");
            }
            if (!Number.isInteger(cantidad) || cantidad <= 0) {
                throw new Error("La cantidad debe ser un número entero mayor a 0.");
            }

            const producto = await Producto.findByPk(idProducto, { transaction: t });

            if (!producto) {
                throw new Error(`Producto con ID ${idProducto} no encontrado.`);
            }

            if (!producto.activo) {
                throw new Error(`El producto '${producto.nombre}' no está disponible.`);
            }

            if (producto.stock < cantidad) {
                throw new Error(`Stock insuficiente para el producto '${producto.nombre}'. Stock actual: ${producto.stock}, solicitado: ${cantidad}.`);
            }

            const precio_unitario = producto.precio;
            const subtotal = precio_unitario * cantidad;
            totalVenta += subtotal;

            detallesCalculados.push({
                producto,
                cantidad,
                precio_unitario,
                subtotal
            });
        }

        const nuevaVenta = await Venta.create({
            total: totalVenta,
            estado: 'registrada',
            id_cliente: id_cliente || null,
            id_usuario: id_usuario || null
        }, { transaction: t });

        for (let detalle of detallesCalculados) {
            await DetalleVenta.create({
                id_venta: nuevaVenta.id_venta,
                id_producto: detalle.producto.id_producto,
                cantidad: detalle.cantidad,
                precio_unitario: detalle.precio_unitario,
                subtotal: detalle.subtotal
            }, { transaction: t });

            detalle.producto.stock -= detalle.cantidad;
            await detalle.producto.save({ transaction: t });
        }

        await t.commit();

        return {
            id_venta: nuevaVenta.id_venta,
            total: totalVenta,
            estado: nuevaVenta.estado,
            items: detallesCalculados.map(d => ({
                producto: d.producto.nombre,
                cantidad: d.cantidad,
                precio_unitario: d.precio_unitario,
                subtotal: d.subtotal
            }))
        };
    } catch (error) {
        await t.rollback();
        throw error; // Re-lanzamos el error para que lo capture el controlador
    }
};

// Lógica para obtener el historial
const obtenerVentasService = async () => {
    return await Venta.findAll({
        include: [
            { model: Cliente, attributes: ['nombre', 'telefono', 'correo'] },
            { 
                model: DetalleVenta, 
                include: [{ model: Producto, attributes: ['nombre', 'precio'] }] 
            }
        ]
    });
};

module.exports = {
    crearVentaService,
    obtenerVentasService
};