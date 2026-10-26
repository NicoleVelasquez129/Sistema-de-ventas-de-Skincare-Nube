const fs = require("fs");
const path = require("path");
const { Producto, Categoria, DetalleVenta } = require("../models");
const sequelize = require("../config/database");
const { Op } = require("sequelize");

const esEnteroNoNegativo = (v) =>
    (typeof v === "number" || typeof v === "string") && v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0;

const textoOpcionalONulo = (v) => (v === undefined ? undefined : (v === null || String(v).trim() === "" ? null : String(v).trim()));

// Borra del disco una imagen subida desde el panel (las URLs externas no se tocan)
const borrarArchivoSubido = (ruta) => {
    if (typeof ruta !== "string" || !/^\/uploads\/[A-Za-z0-9._-]+$/.test(ruta)) return;
    fs.promises.unlink(path.join(__dirname, "..", "uploads", path.basename(ruta))).catch(() => {});
};

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
        const esUrl = /^https?:\/\//i.test(d.imagen);
        const esArchivoSubido = /^\/uploads\/[A-Za-z0-9._-]+$/.test(d.imagen);
        if (typeof d.imagen !== "string" || d.imagen.length > 500 || (!esUrl && !esArchivoSubido)) {
            throw new Error("La imagen debe ser una URL (http:// o https://) o un archivo subido desde el panel (máximo 500 caracteres).");
        }
    }
    for (const campo of ["ingredientes", "modo_uso"]) {
        if (d[campo] !== undefined && d[campo] !== null && (typeof d[campo] !== "string" || d[campo].length > 3000)) {
            throw new Error(`El campo ${campo === "modo_uso" ? "modo de uso" : campo} debe ser texto de máximo 3000 caracteres.`);
        }
    }
    if (d.etiqueta !== undefined && d.etiqueta !== null && (typeof d.etiqueta !== "string" || d.etiqueta.trim().length > 30)) {
        throw new Error("La etiqueta debe ser texto de máximo 30 caracteres.");
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
    const { nombre, descripcion, imagen, precio, stock, stock_minimo, id_categoria, activo } = datos;
    const ingredientes = textoOpcionalONulo(datos.ingredientes);
    const modo_uso = textoOpcionalONulo(datos.modo_uso);
    const etiqueta = textoOpcionalONulo(datos.etiqueta);
    if (!nombre || !precio || stock === undefined || !id_categoria) {
        
        throw new Error("Nombre, precio, stock y categoría son obligatorios.");
    }
    await validarDatosProducto(datos);
    return await Producto.create({ nombre: nombre.trim(), descripcion, imagen, ingredientes, modo_uso, etiqueta, precio, stock, stock_minimo, id_categoria, activo: activo !== undefined ? activo : true });
        
};

const actualizarProductoService = async (id, datos) => {
    const producto = await Producto.findByPk(id);
    if (!producto) throw new Error("Producto no encontrado en Skinker Nube");
        await validarDatosProducto(datos);

    const { nombre, descripcion, imagen, precio, stock, stock_minimo, id_categoria, activo } = datos;
    const imagenAnterior = producto.imagen;
    await producto.update({
        nombre: nombre !== undefined ? nombre.trim() : producto.nombre,
        descripcion: descripcion !== undefined ? descripcion : producto.descripcion,
        imagen: imagen !== undefined ? imagen : producto.imagen,
        ingredientes: datos.ingredientes !== undefined ? textoOpcionalONulo(datos.ingredientes) : producto.ingredientes,
        modo_uso: datos.modo_uso !== undefined ? textoOpcionalONulo(datos.modo_uso) : producto.modo_uso,
        etiqueta: datos.etiqueta !== undefined ? textoOpcionalONulo(datos.etiqueta) : producto.etiqueta,
        precio: precio !== undefined ? precio : producto.precio,
        stock: stock !== undefined ? stock : producto.stock,
        stock_minimo: stock_minimo !== undefined ? stock_minimo : producto.stock_minimo,
        id_categoria: id_categoria !== undefined ? id_categoria : producto.id_categoria,
        activo: activo !== undefined ? activo : producto.activo
    });
    if (imagen !== undefined && imagen !== imagenAnterior) borrarArchivoSubido(imagenAnterior);
    return producto;
};

const desactivarProductoService = async (id) => {
    const producto = await Producto.findByPk(id);
    if (!producto) throw new Error("Producto no encontrado");
    producto.activo = false;
    await producto.save();
    return { id_producto: producto.id_producto, nombre: producto.nombre, activo: producto.activo };
};

// Eliminación real: solo si el producto nunca se vendió (para no perder el historial de ventas)
const eliminarProductoDefinitivoService = async (id) => {
    const producto = await Producto.findByPk(id);
    if (!producto) {
        const err = new Error("Producto no encontrado");
        err.status = 404;
        throw err;
    }
    const ventas = await DetalleVenta.count({ where: { id_producto: producto.id_producto } });
    if (ventas > 0) {
        const err = new Error("No se puede eliminar: este producto ya tiene ventas registradas. Puedes dejarlo inactivo para ocultarlo a los clientes.");
        err.status = 409;
        throw err;
    }
    const resultado = { id_producto: producto.id_producto, nombre: producto.nombre };
    const imagen = producto.imagen;
    await producto.destroy();
    borrarArchivoSubido(imagen);
    return resultado;
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
    eliminarProductoDefinitivoService,
    obtenerProductosStockBajoService
};