const { 
    obtenerProductosService, 
    crearProductoService, 
    actualizarProductoService, 
    desactivarProductoService, 
    eliminarProductoDefinitivoService,
    obtenerProductosStockBajoService 
} = require("../services/productService");

const obtenerProductos = async (req, res) => {
    try {
        const incluirInactivos = req.query.todos === 'true';
        const productos = await obtenerProductosService(incluirInactivos);
        return res.status(200).json({ success: true, total: productos.length, data: productos });
    } catch (error) {
        return res.status(500).json({ success: false, mensaje: "Error al obtener productos", error: error.message });
    }
};

const crearProducto = async (req, res) => {
    try {
        const nuevoProducto = await crearProductoService(req.body);
        return res.status(201).json({ success: true, mensaje: "Producto registrado exitosamente", data: nuevoProducto });
    } catch (error) {
        return res.status(400).json({ success: false, mensaje: "Error al registrar el producto", error: error.message });
    }
};

const actualizarProducto = async (req, res) => {
    try {
        const productoActualizado = await actualizarProductoService(req.params.id, req.body);
        return res.status(200).json({ success: true, mensaje: "Producto actualizado exitosamente", data: productoActualizado });
    } catch (error) {
        return res.status(400).json({ success: false, mensaje: "Error al actualizar el producto", error: error.message });
    }
};

const desactivarProducto = async (req, res) => {
    try {
        const resultado = await desactivarProductoService(req.params.id);
        return res.status(200).json({ success: true, mensaje: "Producto desactivado lógicamente", data: resultado });
    } catch (error) {
        return res.status(404).json({ success: false, mensaje: "Error al desactivar el producto", error: error.message });
    }
};

const eliminarProductoDefinitivo = async (req, res) => {
    try {
        const resultado = await eliminarProductoDefinitivoService(req.params.id);
        return res.status(200).json({ success: true, mensaje: "Producto eliminado definitivamente", data: resultado });
    } catch (error) {
        return res.status(error.status || 400).json({ success: false, mensaje: "Error al eliminar el producto", error: error.message });
    }
};

const obtenerProductosStockBajo = async (req, res) => {
    try {
        const productosBajos = await obtenerProductosStockBajoService();
        return res.status(200).json({
            success: true,
            alerta: productosBajos.length > 0 ? "Hay productos que requieren reposición urgente." : "El inventario está en niveles óptimos.",
            total_afectados: productosBajos.length,
            data: productosBajos
        });
    } catch (error) {
        return res.status(500).json({ success: false, mensaje: "Error al verificar el stock mínimo", error: error.message });
    }
};

module.exports = { obtenerProductos, crearProducto, actualizarProducto, desactivarProducto, eliminarProductoDefinitivo, obtenerProductosStockBajo };