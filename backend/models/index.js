const Categoria = require("./Categoria");
const Producto = require("./Producto");
const Cliente = require("./Cliente");
const Venta = require("./Venta");
const DetalleVenta = require("./DetalleVenta");
const Usuario = require("./Usuario");

// Relaciones
Categoria.hasMany(Producto, { foreignKey: "id_categoria" });
Producto.belongsTo(Categoria, { foreignKey: "id_categoria" });

Venta.belongsTo(Cliente, { foreignKey: "id_cliente" });
Cliente.hasMany(Venta, { foreignKey: "id_cliente" });

Venta.belongsTo(Usuario, { foreignKey: "id_usuario" });
Usuario.hasMany(Venta, { foreignKey: "id_usuario" });

// Relación DetalleVenta -> Venta (Si se borra la venta, se borra su detalle en cascada)
Venta.hasMany(DetalleVenta, { foreignKey: "id_venta", onDelete: "CASCADE" });
DetalleVenta.belongsTo(Venta, { foreignKey: "id_venta" });

// Relación DetalleVenta -> Producto
Producto.hasMany(DetalleVenta, { foreignKey: "id_producto", onDelete: "CASCADE" });
DetalleVenta.belongsTo(Producto, { foreignKey: "id_producto" });

module.exports = {
    Categoria,
    Producto,
    Cliente,
    Venta,
    DetalleVenta,
    Usuario
};