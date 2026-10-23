const { Producto, Categoria } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

const esEnteroNoNegativo = (v) =>
    (typeof v === "number" || typeof v === "string") && v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0;

const validarDatosProducto = async (d) => {
    if (d.nombre !== undefined) {
        if (typeof d.nombre !== "string" || d.nombre.trim() === "" || d.nombre.trim().length > 150) {
            throw new Error("El nombre es obligatorio y debe tener máximo 150 caracteres.");
        }
    }
    if (d.descripcion !== undefined && d.descripcion !== null && typeof d.descripcion !== "string") {
        throw new Error("La descripción debe ser texto.");
    }
    if (d.imagen !== undefined && d.imagen !== null && d.imagen !== "") {
        if (typeof d.imagen !== "string" || d.imagen.length > 500 || !/^https?:\/\//i.test(d.imagen)) {
            throw new Error("La imagen debe ser una URL que empiece con http:// o https:// (máximo 500 caracteres).");
        }
    }
    if (d.precio !== undefined) {
        const p = Number(d.precio);
        if (d.precio === "" || typeof d.precio === "boolean" || !Number.isFinite(p) || p <= 0 || p > 99999999.99) {
            throw new Error("El precio debe ser un número mayor a 0.");
        }
    }
    if (d.stock !== undefined && !esEnteroNoNegativo(d.stock)) {
        throw new Error("El stock debe ser un número entero mayor o igual a 0.");
    }
    if (d.stock_minimo !== undefined && !esEnteroNoNegativo(d.stock_minimo)) {
        throw new Error("El stock mínimo debe ser un número entero mayor o igual a 0.");
    }
    if (d.activo !== undefined && typeof d.activo !== "boolean") {
        throw new Error("El estado activo debe ser verdadero o falso.");
    }
    if (d.id_categoria !== undefined) {
        const idCat = Number(d.id_categoria);
        if (!Number.isInteger(idCat) || idCat <= 0) throw new Error("La categoría indicada no es válida.");
        const categoria = await Categoria.findByPk(idCat);
        if (!categoria) throw new Error("La categoría indicada no existe.");
    }
};

const obtenerProductosService = async (incluirInactivos = false) => {
    return await Producto.findAll({
        where: incluirInactivos ? {} : { activo: true },
        include: [{ model: Categoria, attributes: ['nombre'] }],
        order: [['id_producto', 'ASC']]
    });
};

const crearProductoService = async (datos) => {
    const { nombre, descripcion, imagen, precio, stock, stock_minimo, id_categoria } = datos;
    if (!nombre || !precio || stock === undefined || !id_categoria) {
        
        throw new Error("Nombre, precio, stock y categoría son obligatorios.");
    }
    await validarDatosProducto(datos);
    return await Producto.create({ nombre: nombre.trim(), descripcion, imagen, precio, stock, stock_minimo, id_categoria });
        
};

const actualizarProductoService = async (id, datos) => {
    const producto = await Producto.findByPk(id);
    if (!producto) throw new Error("Producto no encontrado en Skinker Nube");
        await validarDatosProducto(datos);

    const { nombre, descripcion, imagen, precio, stock, stock_minimo, id_categoria, activo } = datos;
    await producto.update({
        nombre: nombre !== undefined ? nombre.trim() : producto.nombre,
        descripcion: descripcion !== undefined ? descripcion : producto.descripcion,
        imagen: imagen !== undefined ? imagen : producto.imagen,
        precio: precio !== undefined ? precio : producto.precio,
        stock: stock !== undefined ? stock : producto.stock,
        stock_minimo: stock_minimo !== undefined ? stock_minimo : producto.stock_minimo,
        id_categoria: id_categoria !== undefined ? id_categoria : producto.id_categoria,
        activo: activo !== undefined ? activo : producto.activo
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