const { Cliente } = require("../models");
const { nombreValido, celularValido, carnetValido } = require("../utils/validaciones");

const limpiar = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);
const campoInformado = (v) => v !== undefined && v !== null && !(typeof v === "string" && !v.trim());

const obtenerClientesService = async () => {
    return await Cliente.findAll();
};

const crearClienteService = async (datos) => {
    const { nombre, telefono, correo } = datos;
    if (!nombreValido(nombre)) throw new Error("El nombre del cliente debe tener solo letras y espacios.");
    if (campoInformado(telefono) && !celularValido(telefono)) throw new Error("El teléfono debe tener 8 números.");
    return await Cliente.create({ nombre: nombre.trim(), telefono: limpiar(telefono), correo });
};

const buscarPorCarnetService = async (carnet) => {
    const valor = limpiar(carnet);
    if (!valor || !carnetValido(valor)) return null;
    return await Cliente.findOne({ where: { carnet: valor } });
};

// Si el carnet ya existe, actualiza sus datos con lo que confirmó el vendedor; si no, crea el cliente
const buscarOCrearClienteService = async (datos, transaction) => {
    if (!nombreValido(datos?.nombre)) throw new Error("El nombre del cliente debe tener solo letras y espacios.");
    if (campoInformado(datos?.telefono) && !celularValido(datos.telefono)) {
        throw new Error("El teléfono del cliente debe tener 8 números.");
    }
    if (campoInformado(datos?.carnet) && !carnetValido(datos.carnet)) {
        throw new Error("El carnet solo puede tener letras, números y un guion (5 a 20 caracteres).");
    }

    const correo = limpiar(datos.correo);
    if (correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
        throw new Error("Ingresa un correo válido para el cliente.");
    }

    const campos = {
        nombre: limpiar(datos.nombre),
        telefono: limpiar(datos.telefono),
        correo: correo ? correo.toLowerCase() : null,
        direccion: limpiar(datos.direccion)
    };

    const carnetLimpio = limpiar(datos.carnet);
    const carnet = carnetLimpio ? carnetLimpio.toUpperCase() : null;
    if (carnet) {
        const existente = await Cliente.findOne({ where: { carnet }, transaction });
        if (existente) {
            await existente.update(campos, { transaction });
            return existente;
        }
    }
    return await Cliente.create({ ...campos, carnet }, { transaction });
};

// Cliente enlazado a la cuenta web por el correo; guarda carnet y dirección si los dieron
const clienteDeCuentaService = async (cuenta, transaction) => {
    const carnet = limpiar(cuenta.carnet);
    const direccion = limpiar(cuenta.direccion);
    const cliente = await Cliente.findOne({ where: { correo: cuenta.usuario.correo }, transaction });
    if (!cliente) {
        return await Cliente.create(
            { nombre: cuenta.usuario.nombre, correo: cuenta.usuario.correo, carnet, direccion },
            { transaction }
        );
    }
    const cambios = {};
    if (carnet) cambios.carnet = carnet;
    if (direccion) cambios.direccion = direccion;
    if (Object.keys(cambios).length) await cliente.update(cambios, { transaction });
    return cliente;
};

module.exports = {
    obtenerClientesService,
    crearClienteService,
    buscarPorCarnetService,
    buscarOCrearClienteService,
    clienteDeCuentaService
};