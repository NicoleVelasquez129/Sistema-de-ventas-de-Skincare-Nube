const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Op } = require("sequelize");
const sequelize = require("../config/database");
const { Usuario, Cliente } = require("../models");
const { enviarCorreo } = require("./emailService");

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VIGENCIA_ENLACE_MS = 60 * 60 * 1000; // 1 hora

const sha256 = (texto) => crypto.createHash("sha256").update(texto).digest("hex");
const escaparHtml = (texto) => String(texto).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

const crearSesion = (usuario) => {
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

const validarContrasenaNueva = (contrasena) => {
    if (typeof contrasena !== "string" || contrasena.length < 8 || contrasena.length > 72) {
        throw errorHttp(400, "La contraseña debe tener entre 8 y 72 caracteres.");
    }
    if (!/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
        throw errorHttp(400, "La contraseña debe incluir al menos una letra y un número.");
    }
};

const loginService = async (correo, contrasena) => {
    if (typeof correo !== "string" || typeof contrasena !== "string" || !correo.trim() || !contrasena) {
        throw errorHttp(400, "Correo y contraseña son obligatorios.");
    }

    const usuario = await Usuario.findOne({ where: { correo: correo.trim().toLowerCase() } });
    const valido = usuario && usuario.activo && await bcrypt.compare(contrasena, usuario.contrasena_cifrada);

    // Mismo mensaje si falla el correo o la contraseña, para no revelar cuál de los dos existe
    if (!valido) throw errorHttp(401, "Correo o contraseña incorrectos.");

    return crearSesion(usuario);
};

// Crea una cuenta de cliente (nunca de administrador) y deja la sesión iniciada
const registrarClienteService = async (datos) => {
    const { nombre, correo, contrasena, telefono } = datos || {};
    if (typeof nombre !== "string" || !nombre.trim() || nombre.trim().length > 150) {
        throw errorHttp(400, "El nombre es obligatorio (máximo 150 caracteres).");
    }
    const correoNormalizado = typeof correo === "string" ? correo.trim().toLowerCase() : "";
    if (!REGEX_CORREO.test(correoNormalizado) || correoNormalizado.length > 150) {
        throw errorHttp(400, "Ingresa un correo electrónico válido.");
    }
    validarContrasenaNueva(contrasena);
    if (telefono !== undefined && telefono !== null && telefono !== "" &&
        (typeof telefono !== "string" || telefono.trim().length > 50)) {
        throw errorHttp(400, "El teléfono debe tener máximo 50 caracteres.");
    }

    const existente = await Usuario.findOne({ where: { correo: correoNormalizado } });
    if (existente) {
        throw errorHttp(409, "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.");
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const t = await sequelize.transaction();
    try {
        const usuario = await Usuario.create(
            { nombre: nombre.trim(), correo: correoNormalizado, contrasena_cifrada: hash, rol: "cliente" },
            { transaction: t }
        );
        // El cliente se enlaza con su cuenta por el correo (se reutiliza si el administrador ya lo había registrado)
        const clienteExistente = await Cliente.findOne({ where: { correo: correoNormalizado }, transaction: t });
        if (!clienteExistente) {
            await Cliente.create(
                { nombre: nombre.trim(), telefono: telefono ? telefono.trim() : null, correo: correoNormalizado },
                { transaction: t }
            );
        }
        await t.commit();
        return crearSesion(usuario);
    } catch (error) {
        await t.rollback();
        if (error.name === "SequelizeUniqueConstraintError") {
            throw errorHttp(409, "Ya existe una cuenta con ese correo. Inicia sesión o recupera tu contraseña.");
        }
        throw error;
    }
};

// Siempre responde igual exista o no el correo, para no revelar qué cuentas existen
const solicitarRestablecimientoService = async (correo) => {
    if (typeof correo !== "string" || !REGEX_CORREO.test(correo.trim())) {
        throw errorHttp(400, "Ingresa un correo electrónico válido.");
    }
    const usuario = await Usuario.findOne({ where: { correo: correo.trim().toLowerCase() } });
    if (usuario && usuario.activo) {
        const token = crypto.randomBytes(32).toString("hex");
        await usuario.update({
            reset_token_hash: sha256(token), // en la base solo se guarda el hash, nunca el token
            reset_expira: new Date(Date.now() + VIGENCIA_ENLACE_MS)
        });
        const enlace = `${process.env.FRONTEND_URL || "http://localhost:5173"}/restablecer?token=${token}`;
        const nombre = escaparHtml(usuario.nombre);
        enviarCorreo({
            para: usuario.correo,
            asunto: "Recupera tu contraseña · Skincare Nube",
            texto: `Hola ${usuario.nombre}, usa este enlace para elegir una nueva contraseña (vale 1 hora): ${enlace}\n\nSi no fuiste tú, ignora este mensaje.`,
            html: `<div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;color:#1c1917">
                <h2 style="color:#0f766e">Skincare Nube</h2>
                <p>Hola ${nombre},</p>
                <p>Recibimos una solicitud para cambiar tu contraseña. El enlace vale <b>1 hora</b>.</p>
                <p><a href="${enlace}" style="display:inline-block;background:#68c3b7;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none;font-weight:bold">Elegir nueva contraseña</a></p>
                <p style="font-size:12px;color:#78716c">Si no fuiste tú, ignora este mensaje: tu contraseña no cambiará.</p>
            </div>`
        }).catch((error) => console.error("No se pudo enviar el correo de recuperación:", error.message));
    }
    return true;
};

const restablecerContrasenaService = async (token, contrasena) => {
    if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
        throw errorHttp(400, "El enlace no es válido o ya venció. Solicita uno nuevo.");
    }
    validarContrasenaNueva(contrasena);
    const usuario = await Usuario.findOne({
        where: { reset_token_hash: sha256(token), reset_expira: { [Op.gt]: new Date() } }
    });
    if (!usuario || !usuario.activo) {
        throw errorHttp(400, "El enlace no es válido o ya venció. Solicita uno nuevo.");
    }
    await usuario.update({
        contrasena_cifrada: await bcrypt.hash(contrasena, 10),
        reset_token_hash: null,
        reset_expira: null
    });
    return true;
};

module.exports = {
    loginService,
    registrarClienteService,
    solicitarRestablecimientoService,
    restablecerContrasenaService
};