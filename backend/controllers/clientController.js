const { obtenerClientesService, crearClienteService } = require("../services/clientService");

const obtenerClientes = async (req, res) => {
    try {
        const clientes = await obtenerClientesService();
        return res.status(200).json({ success: true, total: clientes.length, data: clientes });
    } catch (error) {
        return res.status(500).json({ success: false, mensaje: "Error al obtener clientes", error: error.message });
    }
};

const crearCliente = async (req, res) => {
    try {
        const nuevoCliente = await crearClienteService(req.body);
        return res.status(201).json({ success: true, mensaje: "Cliente registrado con éxito", data: nuevoCliente });
    } catch (error) {
        return res.status(400).json({ success: false, mensaje: "Error al registrar cliente", error: error.message });
    }
};

module.exports = { obtenerClientes, crearCliente };