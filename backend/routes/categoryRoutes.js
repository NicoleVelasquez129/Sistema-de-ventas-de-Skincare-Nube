const express = require("express");
const router = express.Router();
const { obtenerCategorias, crearCategoria } = require("../controllers/categoryController");

router.get("/", obtenerCategorias);     // GET /api/categorias
router.post("/", crearCategoria);       // POST /api/categorias

module.exports = router;