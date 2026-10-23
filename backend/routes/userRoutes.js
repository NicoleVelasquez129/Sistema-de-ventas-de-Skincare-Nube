const express = require("express");
const router = express.Router();
const { obtenerUsuarios } = require("../controllers/userController");
const { verificarToken, soloAdmin } = require("../middlewares/auth");

router.get("/", verificarToken, soloAdmin, obtenerUsuarios);

module.exports = router;