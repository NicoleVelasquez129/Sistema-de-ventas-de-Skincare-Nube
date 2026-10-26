const { Venta, DetalleVenta, Producto, Usuario } = require('../models');
const sequelize = require('../config/database');

async function crearVenta(idUsuario, itemsCarrito) {
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
                subtotal: subtotalItem
            });

            productoDb.stock = Number(productoDb.stock) - cantidad;
            await productoDb.save({ transaction: t });
        }

        const costoEnvio = subtotalGeneral >= 100 ? 0.00 : 15.00;
        const totalFinal = subtotalGeneral + costoEnvio;

        const nuevaVenta = await Venta.create({
            id_usuario: idUsuario,
            total: totalFinal,
            envio: costoEnvio,
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
            { model: DetalleVenta, as: 'detalles', include: [Producto] },
        ],
        order: [['fecha', 'DESC']],
    });
}

module.exports = {
    crearVenta,
    obtenerVentas
};