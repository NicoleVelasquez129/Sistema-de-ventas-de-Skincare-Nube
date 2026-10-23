const { loginService } = require("../services/authService");

const login = async (req, res) => {
    try {
        const { correo, contrasena } = req.body || {};
        const resultado = await loginService(correo, contrasena);
        return res.status(200).json({ success: true, mensaje: "Inicio de sesión exitoso", data: resultado });
    } catch (error) {
        if (error.status) {
            return res.status(error.status).json({ success: false, mensaje: "No se pudo iniciar sesión", error: error.message });
        }
        console.error(error);
        return res.status(500).json({ success: false, mensaje: "No se pudo iniciar sesión", error: "Error interno del servidor" });
    }
};

module.exports = { login };