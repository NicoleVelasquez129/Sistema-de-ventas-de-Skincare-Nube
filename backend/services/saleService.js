const { Venta, DetalleVenta, Producto, Cliente } = require("../models");
const sequelize = require("../config/database");

// Lógica de negocio para registrar una venta
const crearVentaService = async (datosVenta) => {
    const { id_cliente, id_usuario, items } = datosVenta;
    const t = await sequelize.transaction();

    try {
        if (!items || items.length === 0) {
            throw new Error("La venta debe incluir al menos un producto.");
        }

        let totalVenta = 0;
        const detallesCalculados = [];

        for (let item of items) {
            const producto = await Producto.findByPk(item.id_producto, { transaction: t });

            if (!producto) {
                throw new Error(`Producto con ID ${item.id_producto} no encontrado.`);
            }

            if (producto.stock < item.cantidad) {
                throw new Error(`Stock insuficiente para el producto '${producto.nombre}'. Stock actual: ${producto.stock}, solicitado: ${item.cantidad}.`);
            }

            const precio_unitario = producto.precio;
            const subtotal = precio_unitario * item.cantidad;
            totalVenta += subtotal;

            detallesCalculados.push({
                producto,
                cantidad: item.cantidad,
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