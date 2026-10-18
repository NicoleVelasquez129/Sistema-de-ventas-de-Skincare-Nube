const { obtenerUsuariosService, registrarUsuarioService } = require("../services/userService");

const obtenerUsuarios = async (req, res) => {
    try {
        const usuarios = await obtenerUsuariosService();
        return res.status(200).json({ success: true, total: usuarios.length, data: usuarios });
    } catch (error) {
        return res.status(500).json({ success: false, mensaje: "Error al obtener usuarios", error: error.message });
    }
};

const registrarUsuario = async (req, res) => {
    try {
        const nuevoUsuario = await registrarUsuarioService(req.body);
        return res.status(201).json({ success: true, mensaje: "Usuario registrado exitosamente", data: nuevoUsuario });
    } catch (error) {
        return res.status(400).json({ success: false, mensaje: "Error al registrar usuario", error: error.message });
    }
};

module.exports = { obtenerUsuarios, registrarUsuario };