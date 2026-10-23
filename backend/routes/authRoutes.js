const express = require("express");
const rateLimit = require("express-rate-limit");
const router = express.Router();
const { login } = require("../controllers/authController");

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

module.exports = router;