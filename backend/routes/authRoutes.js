const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { login, registro, olvideContrasena, restablecerContrasena } = require("../controllers/authController");

const crearLimite = (ventanaMs, maximo, error) => rateLimit({
    windowMs: ventanaMs,
    limit: maximo,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, mensaje: "Demasiados intentos", error }
});
const limiteRegistro = crearLimite(60 * 60 * 1000, 10, "Demasiados registros desde este equipo. Intente de nuevo en una hora.");
const limiteOlvide = crearLimite(15 * 60 * 1000, 5, "Demasiadas solicitudes. Intente de nuevo en 15 minutos.");
const limiteRestablecer = crearLimite(15 * 60 * 1000, 10, "Demasiados intentos. Intente de nuevo en 15 minutos.");

const limiteLogin = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        mensaje: "Demasiados intentos",
        error: "Demasiados intentos de inicio de sesión. Intente de nuevo en 15 minutos."
    }
});

router.post("/login", limiteLogin, login);
router.post("/registro", limiteRegistro, registro);                         // POST /api/auth/registro
router.post("/olvide-contrasena", limiteOlvide, olvideContrasena);          // POST /api/auth/olvide-contrasena
router.post("/restablecer-contrasena", limiteRestablecer, restablecerContrasena); // POST /api/auth/restablecer-contrasena

module.exports = router;