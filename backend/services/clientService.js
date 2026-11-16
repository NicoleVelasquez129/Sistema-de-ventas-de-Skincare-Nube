const { Cliente } = require("../models");

const obtenerClientesService = async () => {
    return await Cliente.findAll();
};

const crearClienteService = async (datos) => {
    const { nombre, telefono, correo } = datos;
    if (!nombre) throw new Error("El nombre del cliente es obligatorio.");
    return await Cliente.create({ nombre, telefono, correo });
};

const limpiar = (v) => (typeof v === "string" && v.trim() ? v.trim() : null);

const buscarPorCarnetService = async (carnet) => {
    const valor = limpiar(carnet);
    if (!valor) return null;
    return await Cliente.findOne({ where: { carnet: valor } });
};

// Si el carnet ya existe, actualiza sus datos con lo que confirmó el vendedor; si no, crea el cliente
const buscarOCrearClienteService = async (datos, transaction) => {
    if (!limpiar(datos?.nombre)) throw new Error("El nombre del cliente es obligatorio.");

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

    const carnet = limpiar(datos.carnet);
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