const {
    loginService,
    registrarClienteService,
    solicitarRestablecimientoService,
    restablecerContrasenaService
} = require("../services/authService");

const responderError = (res, error, mensaje) => {
    if (error.status) {
        return res.status(error.status).json({ success: false, mensaje, error: error.message });
    }
    console.error(error);
    return res.status(500).json({ success: false, mensaje, error: "Error interno del servidor" });
};

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

const registro = async (req, res) => {
    try {
        const resultado = await registrarClienteService(req.body);
        return res.status(201).json({ success: true, mensaje: "Cuenta creada con éxito", data: resultado });
    } catch (error) {
        return responderError(res, error, "No se pudo crear la cuenta");
    }
};

const olvideContrasena = async (req, res) => {
    try {
        await solicitarRestablecimientoService((req.body || {}).correo);
        return res.status(200).json({
            success: true,
            mensaje: "Si el correo está registrado, te enviamos un enlace para cambiar tu contraseña."
        });
    } catch (error) {
        return responderError(res, error, "No se pudo procesar la solicitud");
    }
};

const restablecerContrasena = async (req, res) => {
    try {
        const { token, contrasena } = req.body || {};
        await restablecerContrasenaService(token, contrasena);
        return res.status(200).json({ success: true, mensaje: "Contraseña actualizada. Ya puedes iniciar sesión." });
    } catch (error) {
        return responderError(res, error, "No se pudo cambiar la contraseña");
    }
};

module.exports = { login, registro, olvideContrasena, restablecerContrasena };