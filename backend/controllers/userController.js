const {
    obtenerUsuariosService, registrarUsuarioService, obtenerVendedoresService,
    crearVendedorService, cambiarActivoVendedorService, ventasDeVendedorService
} = require("../services/userService");

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

const responder = (res, error) =>
    res.status(error.status || 400).json({ success: false, mensaje: error.message, error: error.message });

const obtenerVendedores = async (req, res) => {
    try {
        const data = await obtenerVendedoresService();
        return res.status(200).json({ success: true, total: data.length, data });
    } catch (error) { return responder(res, error); }
};

const crearVendedor = async (req, res) => {
    try {
        const data = await crearVendedorService(req.body);
        return res.status(201).json({ success: true, mensaje: "Vendedor creado", data });
    } catch (error) { return responder(res, error); }
};

const cambiarActivoVendedor = async (req, res) => {
    try {
        const data = await cambiarActivoVendedorService(req.params.id, req.body?.activo);
        return res.status(200).json({ success: true, mensaje: "Vendedor actualizado", data });
    } catch (error) { return responder(res, error); }
};

const ventasDeVendedor = async (req, res) => {
    try {
        const data = await ventasDeVendedorService(req.params.id);
        return res.status(200).json({ success: true, total: data.length, data });
    } catch (error) { return responder(res, error); }
};

module.exports = { obtenerUsuarios, registrarUsuario, obtenerVendedores, crearVendedor, cambiarActivoVendedor, ventasDeVendedor };