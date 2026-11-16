const express = require("express");
const router = express.Router();
const { verificarToken, soloAdmin } = require("../middlewares/auth");
const { reporteVentas, reporteGanancias, reporteInventario } = require("../controllers/reportController");

router.get("/ventas", verificarToken, soloAdmin, reporteVentas);
router.get("/ganancias", verificarToken, soloAdmin, reporteGanancias);
router.get("/inventario", verificarToken, soloAdmin, reporteInventario);

module.exports = router;
