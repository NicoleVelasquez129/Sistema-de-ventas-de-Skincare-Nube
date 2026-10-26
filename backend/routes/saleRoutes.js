const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin } = require('../middlewares/auth');
const {
    registrarVenta,
    obtenerVentas,
    descargarFacturaPDF
} = require('../controllers/saleController');

// Registrar una nueva venta (requiere estar autenticado)
router.post('/', verificarToken, registrarVenta);

// Obtener el historial de ventas
router.get('/', verificarToken, soloAdmin, obtenerVentas);

// Descargar la factura en PDF de una venta específica
router.get('/:id/factura', verificarToken, descargarFacturaPDF);

module.exports = router;