const express = require("express");
const router = express.Router();
const { registrarVenta, obtenerVentas } = require("../controllers/saleController");

router.get("/", obtenerVentas);       // GET /api/ventas (Historial)
router.post("/", registrarVenta);   // POST /api/ventas (Registrar venta y descontar stock)

module.exports = router;