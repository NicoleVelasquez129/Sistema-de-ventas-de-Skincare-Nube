const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { Usuario, Venta } = require("../models");
const { obtenerVentasDeVendedor } = require("./saleService");
const { nombreValido } = require("../utils/validaciones");

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const errorHttp = (status, mensaje) => {
    const error = new Error(mensaje);
    error.status = status;
    return error;
};

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

// Lista de vendedores con sus ventas con pago confirmado (las anuladas y pendientes no cuentan)
const obtenerVendedoresService = async () => {
    const vendedores = await Usuario.findAll({
        where: { rol: "vendedor" },
        attributes: ["id_usuario", "nombre", "correo", "activo", "createdAt"],
        order: [["nombre", "ASC"]]
    });
    const ventas = await Venta.findAll({
        where: {
            id_vendedor: { [Op.in]: vendedores.map(v => v.id_usuario) },
            estado: { [Op.ne]: "anulada" },
            estado_pedido: { [Op.ne]: "pendiente" }
        },
        attributes: ["id_vendedor", "total"]
    });
    return vendedores.map(v => {
        const suyas = ventas.filter(x => x.id_vendedor === v.id_usuario);
        return {
            ...v.toJSON(),
            ventas_pagadas: suyas.length,
            total_vendido: suyas.reduce((suma, x) => suma + Number(x.total), 0)
        };
    });
};

const crearVendedorService = async (datos) => {
    const { nombre, correo, contrasena } = datos || {};
    if (!nombreValido(nombre)) {
        throw errorHttp(400, "El nombre debe tener solo letras y espacios (entre 2 y 150 caracteres).");
    }
    const correoNormalizado = typeof correo === "string" ? correo.trim().toLowerCase() : "";
    if (!REGEX_CORREO.test(correoNormalizado) || correoNormalizado.length > 150) {
        throw errorHttp(400, "Ingresa un correo electrónico válido.");
    }
    if (typeof contrasena !== "string" || contrasena.length < 8 || contrasena.length > 72 ||
        !/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
        throw errorHttp(400, "La contraseña debe tener entre 8 y 72 caracteres, con al menos una letra y un número.");
    }
    if (await Usuario.findOne({ where: { correo: correoNormalizado } })) {
        throw errorHttp(409, "Ya existe una cuenta con ese correo.");
    }
    const hash = await bcrypt.hash(contrasena, 10);
    const vendedor = await Usuario.create({
        nombre: nombre.trim(), correo: correoNormalizado, contrasena_cifrada: hash, rol: "vendedor"
    });
    return { id_usuario: vendedor.id_usuario, nombre: vendedor.nombre, correo: vendedor.correo, activo: vendedor.activo };
};

const cambiarActivoVendedorService = async (id, activo) => {
    if (typeof activo !== "boolean") throw errorHttp(400, "Indica si el vendedor queda activo o inactivo.");
    const vendedor = await Usuario.findOne({ where: { id_usuario: id, rol: "vendedor" } });
    if (!vendedor) throw errorHttp(404, "Vendedor no encontrado.");
    await vendedor.update({ activo });
    return { id_usuario: vendedor.id_usuario, activo: vendedor.activo };
};

const ventasDeVendedorService = async (id) => {
    const vendedor = await Usuario.findOne({ where: { id_usuario: id, rol: "vendedor" }, attributes: ["id_usuario"] });
    if (!vendedor) throw errorHttp(404, "Vendedor no encontrado.");
    return await obtenerVentasDeVendedor(vendedor.id_usuario);
};

module.exports = {
    obtenerUsuariosService,
    registrarUsuarioService,
    obtenerVendedoresService,
    crearVendedorService,
    cambiarActivoVendedorService,
    ventasDeVendedorService
};
