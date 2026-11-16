const express = require("express");
const router = express.Router();
const { verificarToken, soloAdmin, adminOVendedor } = require("../middlewares/auth");
const { obtenerClientes, crearCliente, buscarPorCarnet } = require("../controllers/clientController");

router.get("/carnet/:carnet", verificarToken, adminOVendedor, buscarPorCarnet);
router.get("/", verificarToken, soloAdmin, obtenerClientes);
router.post("/", verificarToken, soloAdmin, crearCliente);

module.exports = router;