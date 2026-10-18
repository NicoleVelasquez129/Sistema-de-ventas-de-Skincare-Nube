const { Categoria, Producto } = require("../models");

const obtenerCategoriasService = async () => {
    return await Categoria.findAll({
        include: [{ model: Producto, attributes: ['id_producto', 'nombre', 'precio', 'stock'] }]
    });
};

const crearCategoriaService = async (datos) => {
    const { nombre, descripcion } = datos;
    if (!nombre) throw new Error("El nombre de la categoría es obligatorio.");
    return await Categoria.create({ nombre, descripcion });
};

module.exports = {
    obtenerCategoriasService,
    crearCategoriaService
};