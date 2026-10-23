const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Producto = sequelize.define("Producto", {
    id_producto: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: { msg: "El nombre del producto no puede estar vacío." }
        }
    },
    descripcion: {
        type: DataTypes.TEXT
    },
        descripcion: {
        type: DataTypes.TEXT
    },
    // punto de imagen
    imagen: {
        type: DataTypes.STRING(500),
        allowNull: true
    },

    precio: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
            isDecimal: { msg: "El precio debe ser un valor numérico." },
            min: { args: [0], msg: "El precio no puede ser negativo." } // Validación de datos (RF03 / HU03)
        }
    },
    stock: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: "El stock no puede ser menor a 0." }
        }
    },
    stock_minimo: {
        type: DataTypes.INTEGER,
        defaultValue: 5
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: "productos",
    timestamps: true
});

module.exports = Producto;