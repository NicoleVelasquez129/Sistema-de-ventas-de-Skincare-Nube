const { crearVentaService, obtenerVentasService } = require("../services/saleService");

const registrarVenta = async (req, res) => {
    try {
        const resultadoVenta = await crearVentaService(req.body);
        return res.status(201).json({
            success: true,
            mensaje: "Venta registrada con éxito y stock actualizado automáticamente",
            data: resultadoVenta
        });
    } catch (error) {
        return res.status(400).json({
            success: false,
            mensaje: "Error al procesar la venta",
            error: error.message
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

module.exports = {
    registrarVenta,
    obtenerVentas
};