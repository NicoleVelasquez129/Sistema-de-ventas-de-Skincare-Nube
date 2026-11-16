const express = require('express');
const router = express.Router();
const { verificarToken, soloAdmin, adminOVendedor } = require('../middlewares/auth');
const { validateId } = require('../middlewares/validateId');
const { subirComprobante } = require('../middlewares/upload');
const {
    registrarVenta,
    obtenerVentas,
    descargarFacturaPDF,
    registrarVentaVendedor,
    registrarPago,
    obtenerMisVentas,
    anularVenta,
    subirComprobanteVenta, misPedidos, pedidosEnLinea, rechazarPagoVenta, cambiarEstadoPedido
} = require('../controllers/saleController');

// Registrar una nueva venta (requiere estar autenticado)
router.post('/', verificarToken, registrarVenta);

// Obtener el historial de ventas
router.get('/', verificarToken, soloAdmin, obtenerVentas);

// Descargar la factura en PDF de una venta específica
router.get('/:id/factura', verificarToken, descargarFacturaPDF);

// Ventas del vendedor
router.post('/vendedor', verificarToken, adminOVendedor, registrarVentaVendedor);
router.get('/mias', verificarToken, adminOVendedor, obtenerMisVentas);
router.post('/:id/pagos', verificarToken, adminOVendedor, validateId, registrarPago);
router.patch('/:id/cancelar', verificarToken, validateId, anularVenta);

// Cliente
router.get('/mis-pedidos', verificarToken, misPedidos);
router.post('/:id/comprobante', verificarToken, validateId, subirComprobante, subirComprobanteVenta);

// Vendedor de pedidos en línea
router.get('/en-linea', verificarToken, adminOVendedor, pedidosEnLinea);
router.patch('/:id/rechazar-pago', verificarToken, adminOVendedor, validateId, rechazarPagoVenta);
router.patch('/:id/estado', verificarToken, adminOVendedor, validateId, cambiarEstadoPedido);

module.exports = router;