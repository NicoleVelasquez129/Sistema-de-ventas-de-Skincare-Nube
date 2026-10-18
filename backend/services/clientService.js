const { Cliente } = require("../models");

const obtenerClientesService = async () => {
    return await Cliente.findAll();
};

const crearClienteService = async (datos) => {
    const { nombre, telefono, correo } = datos;
    if (!nombre) throw new Error("El nombre del cliente es obligatorio.");
    return await Cliente.create({ nombre, telefono, correo });
};

module.exports = {
    obtenerClientesService,
    crearClienteService
};