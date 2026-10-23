const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Usuario } = require("../models");

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const loginService = async (correo, contrasena) => {
    if (typeof correo !== "string" || typeof contrasena !== "string" || !correo.trim() || !contrasena) {
        throw errorHttp(400, "Correo y contraseña son obligatorios.");
    }

    const usuario = await Usuario.findOne({ where: { correo: correo.trim().toLowerCase() } });
    const valido = usuario && usuario.activo && await bcrypt.compare(contrasena, usuario.contrasena_cifrada);

    // Mismo mensaje si falla el correo o la contraseña, para no revelar cuál de los dos existe
    if (!valido) throw errorHttp(401, "Correo o contraseña incorrectos.");

    const token = jwt.sign(
        { id_usuario: usuario.id_usuario, rol: usuario.rol },
        process.env.JWT_SECRET,
        { algorithm: "HS256", expiresIn: process.env.JWT_EXPIRES_IN || "8h" }
    );

    return {
        token,
        usuario: {
            id_usuario: usuario.id_usuario,
            nombre: usuario.nombre,
            correo: usuario.correo,
            rol: usuario.rol
        }
    };
};

module.exports = { loginService };