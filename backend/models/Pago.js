const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Pago = sequelize.define("Pago", {
    id_pago: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    monto: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    metodo: { type: DataTypes.ENUM('efectivo', 'qr', 'transferencia'), allowNull: false },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    id_venta: { type: DataTypes.INTEGER, allowNull: false },
    id_usuario: { type: DataTypes.INTEGER, allowNull: true }
}, {
    tableName: "pagos",
    timestamps: true
});

module.exports = Pago;