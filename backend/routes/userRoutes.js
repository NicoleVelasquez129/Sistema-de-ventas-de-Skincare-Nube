const express = require("express");
const router = express.Router();
const {
    obtenerUsuarios, obtenerVendedores, crearVendedor, cambiarActivoVendedor, ventasDeVendedor
} = require("../controllers/userController");
const { verificarToken, soloAdmin } = require("../middlewares/auth");
const { validateId } = require("../middlewares/validateId");

router.get("/", verificarToken, soloAdmin, obtenerUsuarios);
router.get("/vendedores", verificarToken, soloAdmin, obtenerVendedores);
router.post("/vendedores", verificarToken, soloAdmin, crearVendedor);
router.patch("/vendedores/:id/activo", verificarToken, soloAdmin, validateId, cambiarActivoVendedor);
router.get("/vendedores/:id/ventas", verificarToken, soloAdmin, validateId, ventasDeVendedor);

module.exports = router;
