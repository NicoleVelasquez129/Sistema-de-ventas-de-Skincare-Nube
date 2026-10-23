const express = require("express");

const router = express.Router();
const { validateId } = require("../middlewares/validateId");
const { 
    obtenerProductos, 
    crearProducto, 
    actualizarProducto, 
    desactivarProducto ,
    obtenerProductosStockBajo
} = require("../controllers/productController");

// Definición de Endpoints REST (Endpoints documentados para la API)
router.get("/", obtenerProductos);         // GET /api/productos
router.post("/", crearProducto);       // POST /api/productos
router.put("/:id", validateId, actualizarProducto); // PUT /api/productos/:id
router.delete("/:id", validateId, desactivarProducto); // DELETE /api/productos/:id
router.get("/stock-bajo", obtenerProductosStockBajo);

module.exports = router;