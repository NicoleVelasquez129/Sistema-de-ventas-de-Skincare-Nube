const express = require("express");
const router = express.Router();
const { verificarToken, soloAdmin } = require("../middlewares/auth");
const { subirImagen } = require("../middlewares/upload");
const { subirImagenProducto } = require("../controllers/uploadController");

router.post("/", verificarToken, soloAdmin, subirImagen, subirImagenProducto); // POST /api/upload

module.exports = router;