const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Cliente = sequelize.define("Cliente", {
    id_cliente: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El nombre del cliente no puede estar vacío." }
        }
    },
        carnet: {
        type: DataTypes.STRING(20),
        allowNull: true
    },
    telefono: {
        type: DataTypes.STRING(50)
    },
    correo: {
        type: DataTypes.STRING(150),
        validate: {
            isEmail: { msg: "Debe proporcionar un correo electrónico válido." }
        }
    },
    direccion: {
    type: DataTypes.STRING(255),
    allowNull: true
    }
    
}, {
    tableName: "clientes",
    timestamps: true
});

module.exports = Cliente;