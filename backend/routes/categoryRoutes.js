const express = require("express");
const router = express.Router();
const { validateId } = require("../middlewares/validateId");
const { verificarToken, soloAdmin } = require("../middlewares/auth");
const { obtenerCategorias, crearCategoria, actualizarCategoria, eliminarCategoria } = require("../controllers/categoryController");

router.get("/", obtenerCategorias);     // GET /api/categorias
router.post("/", verificarToken, soloAdmin, crearCategoria);     // POST /api/categorias
router.put("/:id", verificarToken, soloAdmin, validateId, actualizarCategoria);    // PUT /api/categorias/:id
router.delete("/:id", verificarToken, soloAdmin, validateId, eliminarCategoria);   // DELETE /api/categorias/:id

module.exports = router;