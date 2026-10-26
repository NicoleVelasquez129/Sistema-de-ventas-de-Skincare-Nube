const express = require("express");

const router = express.Router();
const { validateId } = require("../middlewares/validateId");
const { verificarToken, soloAdmin, adminSiPideTodos } = require("../middlewares/auth");
const { 
    obtenerProductos, 
    crearProducto, 
    actualizarProducto, 
    desactivarProducto ,
    eliminarProductoDefinitivo,
    obtenerProductosStockBajo
} = require("../controllers/productController");

// Definición de Endpoints REST (Endpoints documentados para la API)
router.get("/", adminSiPideTodos, obtenerProductos);
router.post("/", verificarToken, soloAdmin, crearProducto);
router.put("/:id", verificarToken, soloAdmin, validateId, actualizarProducto);
router.delete("/:id", verificarToken, soloAdmin, validateId, desactivarProducto);
router.delete("/:id/definitivo", verificarToken, soloAdmin, validateId, eliminarProductoDefinitivo);
router.get("/stock-bajo", verificarToken, soloAdmin, obtenerProductosStockBajo);

module.exports = router;