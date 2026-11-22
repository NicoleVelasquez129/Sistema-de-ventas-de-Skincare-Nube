const { Sequelize } = require("sequelize");
require("dotenv").config();

// Configuración de la conexión con Sequelize (ORM)
const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
        dialect: process.env.DB_DIALECT || "mysql",
        logging: false // Evita saturar la consola con logs SQL innecesarios
    }
);

module.exports = sequelize;