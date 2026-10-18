const { obtenerCategoriasService, crearCategoriaService } = require("../services/categoryService");

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
        return res.status(400).json({ success: false, mensaje: "Error al crear la categoría", error: error.message });
    }
};

module.exports = { obtenerCategorias, crearCategoria };