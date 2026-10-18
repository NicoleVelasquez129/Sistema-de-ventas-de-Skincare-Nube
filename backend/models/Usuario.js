const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Usuario = sequelize.define("Usuario", {
    id_usuario: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    nombre: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
            notEmpty: { msg: "El nombre del usuario no puede estar vacío." }
        }
    },
    correo: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: { msg: "El correo ya está registrado en el sistema." },
        validate: {
            isEmail: { msg: "Debe ser un correo electrónico válido." }
        }
    },
    contrasena_cifrada: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    rol: {
        type: DataTypes.ENUM('administrador', 'vendedor'),
        allowNull: false,
        defaultValue: 'vendedor'
    },
    activo: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
}, {
    tableName: "usuarios",
    timestamps: true
});

module.exports = Usuario;