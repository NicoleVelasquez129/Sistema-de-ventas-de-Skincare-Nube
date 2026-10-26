const { Usuario } = require("../models");

const obtenerUsuariosService = async () => {
    return await Usuario.findAll({ attributes: { exclude: ['contrasena_cifrada', 'reset_token_hash', 'reset_expira'] } });
};

const registrarUsuarioService = async (datos) => {
    const { nombre, correo, contrasena_cifrada, rol } = datos;
    if (!nombre || !correo || !contrasena_cifrada) {
        throw new Error("Nombre, correo y contraseña son obligatorios.");
    }
    const nuevoUsuario = await Usuario.create({ nombre, correo, contrasena_cifrada, rol });
    return {
        id_usuario: nuevoUsuario.id_usuario,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol
    };
};

module.exports = {
    obtenerUsuariosService,
    registrarUsuarioService
};