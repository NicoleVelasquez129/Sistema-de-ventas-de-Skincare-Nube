const {
    obtenerCategoriasService,
    crearCategoriaService,
    actualizarCategoriaService,
    eliminarCategoriaService
} = require("../services/categoryService");

const obtenerCategorias = async (req, res) => {
    try {
        const categorias = await obtenerCategoriasService();
        return res.status(200).json({ success: true, total: categorias.length, data: categorias });
    } catch (error) {
        return res.status(500).json({ success: false, mensaje: "Error al obtener categorías", error: error.message });
    }
};

const crearCategoria = async (req, res) => {
    try {
        const nuevaCategoria = await crearCategoriaService(req.body);
        return res.status(201).json({ success: true, mensaje: "Categoría creada exitosamente", data: nuevaCategoria });
    } catch (error) {
        return res.status(error.status || 400).json({ success: false, mensaje: "Error al crear la categoría", error: error.message });
    }
};

const actualizarCategoria = async (req, res) => {
    try {
        const categoria = await actualizarCategoriaService(req.params.id, req.body);
        return res.status(200).json({ success: true, mensaje: "Categoría actualizada exitosamente", data: categoria });
    } catch (error) {
        return res.status(error.status || 400).json({ success: false, mensaje: "Error al actualizar la categoría", error: error.message });
    }
};

const eliminarCategoria = async (req, res) => {
    try {
        const resultado = await eliminarCategoriaService(req.params.id);
        return res.status(200).json({ success: true, mensaje: "Categoría eliminada", data: resultado });
    } catch (error) {
        return res.status(error.status || 400).json({ success: false, mensaje: "Error al eliminar la categoría", error: error.message });
    }
};

module.exports = { obtenerCategorias, crearCategoria, actualizarCategoria, eliminarCategoria };