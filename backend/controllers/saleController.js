const { Venta, Usuario, DetalleVenta, Producto } = require('../models');
const { crearVenta, obtenerVentas: obtenerVentasService } = require('../services/saleService');

const registrarVenta = async (req, res) => {
    try {
        const resultadoVenta = await crearVenta(req.usuario.id_usuario, req.body?.items);
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
                { model: DetalleVenta, as: 'detalles', include: [Producto] }
            ]
        });

        if (!venta) {
            return res.status(404).json({ mensaje: 'Venta no encontrada' });
        }
        if (venta.id_usuario !== req.usuario.id_usuario && req.usuario.rol !== 'administrador') {
            return res.status(403).json({ mensaje: 'No tienes permiso para descargar esta factura.' });
        }

        const pdfBuffer = await generarFacturaPDF(venta);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Factura_${venta.id_venta}.pdf`);
        return res.send(pdfBuffer);

    } catch (error) {
        return res.status(500).json({ mensaje: 'Error al generar la factura PDF', error: error.message });
    }
}

module.exports = {
    registrarVenta,
    obtenerVentas,
    descargarFacturaPDF
};