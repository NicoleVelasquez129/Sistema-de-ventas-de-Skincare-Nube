const { Categoria, Producto } = require("../models");
const { fn, col, where } = require("sequelize");

const errorConEstado = (mensaje, estado) => {
    const err = new Error(mensaje);
    err.status = estado;
    return err;
};

// Valida nombre/descripcion y evita nombres repetidos (sin distinguir mayúsculas)
const validarCategoria = async (datos, idActual = null) => {
    if (datos.nombre !== undefined) {
        if (typeof datos.nombre !== "string" || datos.nombre.trim() === "" || datos.nombre.trim().length > 100) {
            throw new Error("El nombre de la categoría es obligatorio y debe tener máximo 100 caracteres.");
        }
        const repetida = await Categoria.findOne({
            where: where(fn("LOWER", col("nombre")), datos.nombre.trim().toLowerCase())
        });
        if (repetida && repetida.id_categoria !== idActual) {
            throw errorConEstado("Ya existe una categoría con ese nombre.", 409);
        }
    }
    if (datos.descripcion !== undefined && datos.descripcion !== null &&
        (typeof datos.descripcion !== "string" || datos.descripcion.length > 1000)) {
        throw new Error("La descripción debe ser texto de máximo 1000 caracteres.");
    }
};

const obtenerCategoriasService = async () => {
    return await Categoria.findAll({
        include: [{ model: Producto, attributes: ['id_producto', 'nombre', 'precio', 'stock'] }]
    });
};

const crearCategoriaService = async (datos) => {
    const { nombre, descripcion } = datos;
    if (!nombre) throw new Error("El nombre de la categoría es obligatorio.");
    await validarCategoria(datos);
    return await Categoria.create({ nombre: nombre.trim(), descripcion });
};

const actualizarCategoriaService = async (id, datos) => {
    const categoria = await Categoria.findByPk(id);
    if (!categoria) throw errorConEstado("Categoría no encontrada", 404);
    await validarCategoria(datos, categoria.id_categoria);
    await categoria.update({
        nombre: datos.nombre !== undefined ? datos.nombre.trim() : categoria.nombre,
        descripcion: datos.descripcion !== undefined ? datos.descripcion : categoria.descripcion
    });
    return categoria;
};

// No se elimina una categoría con productos, para que ningún producto quede sin categoría
const eliminarCategoriaService = async (id) => {
    const categoria = await Categoria.findByPk(id);
    if (!categoria) throw errorConEstado("Categoría no encontrada", 404);
    const productos = await Producto.count({ where: { id_categoria: categoria.id_categoria } });
    if (productos > 0) {
        throw errorConEstado(
            `No se puede eliminar: la categoría tiene ${productos} producto${productos === 1 ? "" : "s"}. Cámbialos de categoría o elimínalos primero.`,
            409
        );
    }
    const resultado = { id_categoria: categoria.id_categoria, nombre: categoria.nombre };
    await categoria.destroy();
    return resultado;
};

module.exports = {
    obtenerCategoriasService,
    crearCategoriaService,
    actualizarCategoriaService,
    eliminarCategoriaService
};