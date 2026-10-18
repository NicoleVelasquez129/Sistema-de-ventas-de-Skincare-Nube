const { Producto, Categoria } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

const obtenerProductosService = async () => {
    return await Producto.findAll({
        where: { activo: true },
        include: [{ model: Categoria, attributes: ['nombre'] }]
    });
};

const crearProductoService = async (datos) => {
    const { nombre, descripcion, precio, stock, stock_minimo, id_categoria } = datos;
    if (!nombre || !precio || stock === undefined || !id_categoria) {
        throw new Error("Nombre, precio, stock y categoría son obligatorios.");
    }
    return await Producto.create({ nombre, descripcion, precio, stock, stock_minimo, id_categoria });
};

const actualizarProductoService = async (id, datos) => {
    const producto = await Producto.findByPk(id);
    if (!producto) throw new Error("Producto no encontrado en Skinker Nube");

    const { nombre, descripcion, precio, stock, stock_minimo, id_categoria } = datos;
    await producto.update({
        nombre: nombre !== undefined ? nombre : producto.nombre,
        descripcion: descripcion !== undefined ? descripcion : producto.descripcion,
        precio: precio !== undefined ? precio : producto.precio,
        stock: stock !== undefined ? stock : producto.stock,
        stock_minimo: stock_minimo !== undefined ? stock_minimo : producto.stock_minimo,
        id_categoria: id_categoria !== undefined ? id_categoria : producto.id_categoria
    });
    return producto;
};

const desactivarProductoService = async (id) => {
    const producto = await Producto.findByPk(id);
    if (!producto) throw new Error("Producto no encontrado");
    producto.activo = false;
    await producto.save();
    return { id_producto: producto.id_producto, nombre: producto.nombre, activo: producto.activo };
};

const obtenerProductosStockBajoService = async () => {
    return await Producto.findAll({
        where: {
            stock: { [Op.lte]: sequelize.col('stock_minimo') },
            activo: true
        },
        include: [{ model: Categoria, attributes: ['nombre'] }]
    });
};

module.exports = {
    obtenerProductosService,
    crearProductoService,
    actualizarProductoService,
    desactivarProductoService,
    obtenerProductosStockBajoService
};