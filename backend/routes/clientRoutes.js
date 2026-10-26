const express = require("express");
const router = express.Router();
const { verificarToken, soloAdmin } = require("../middlewares/auth");
const { obtenerClientes, crearCliente } = require("../controllers/clientController");

router.get("/", verificarToken, soloAdmin, obtenerClientes);
router.post("/", verificarToken, soloAdmin, crearCliente);

module.exports = router;