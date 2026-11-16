const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Venta = sequelize.define('Venta', {
    id_venta: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    envio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    estado: {
        type: DataTypes.ENUM('registrada', 'anulada'),
        defaultValue: 'registrada'
    },
        estado_pedido: {
        type: DataTypes.ENUM('pendiente', 'pagado', 'enviado', 'entregado'),
        allowNull: false,
        defaultValue: 'pendiente'
    },
    direccion_entrega: { type: DataTypes.STRING(255), allowNull: true },
    ubicacion_lat: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    ubicacion_lng: { type: DataTypes.DECIMAL(10, 7), allowNull: true },
    imagen_entrega: { type: DataTypes.STRING(500), allowNull: true },
    comprobante_pago: { type: DataTypes.STRING(500), allowNull: true },
    mensaje_pago: { type: DataTypes.STRING(255), allowNull: true },
    fecha_entrega: { type: DataTypes.DATE, allowNull: true },

    id_cliente: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    id_usuario: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    id_vendedor: {
        type: DataTypes.INTEGER,
        allowNull: true
    }
}, {
    tableName: 'ventas',
    timestamps: true
});



module.exports = Venta;