const express = require("express");
const cors = require("cors");
const sequelize = require("./config/database");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares transversales
app.use(express.json());
app.use(cors());

// Importar Rutas REST
const productRoutes = require("./routes/productRoutes");
const saleRoutes = require("./routes/saleRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const clientRoutes = require("./routes/clientRoutes");
const userRoutes = require("./routes/userRoutes");

// Ruta raíz de documentación básica de la API
app.get("/", (req, res) => {
    res.status(200).json({
        nombre: "API REST - Sistema de Ventas Skinker Nube",
        version: "2.0.0",
        arquitectura: "MVC con Sequelize ORM y MySQL",
        endpoints_disponibles: {
            "GET /api/productos": "Lista todos los productos de skincare",
            "POST /api/productos": "Registra un nuevo producto (Valida stock y precios)",
            "PUT /api/productos/:id": "Actualiza la información de un producto",
            "DELETE /api/productos/:id": "Desactiva lógicamente un producto del inventario",
            "GET /api/ventas": "Lista todas las ventas registradas",
            "POST /api/ventas": "Registra una nueva venta y descuenta el stock de los productos",
            "GET /api/categorias": "Lista todas las categorías con sus productos asociados",
            "POST /api/categorias": "Registra una nueva categoría de skincare",
            "GET /api/clientes": "Lista todos los clientes registrados",
            "POST /api/clientes": "Registra un nuevo cliente",
            "GET /api/usuarios": "Lista todos los usuarios del sistema",
            "POST /api/usuarios": "Registra un nuevo usuario"
        }
    });
});

// Enrutar endpoints principales
app.use("/api/productos", productRoutes);
app.use("/api/ventas", saleRoutes);
app.use("/api/categorias", categoryRoutes);
app.use("/api/clientes", clientRoutes);
app.use("/api/usuarios", userRoutes);

// Conexión a la Base de Datos y arranque del Servidor
async function iniciarServidor() {
    try {
        await sequelize.authenticate();
        console.log("Conexión a MySQL Workbench establecida exitosamente.");
        
        // Sincroniza los modelos creando las tablas automáticamente si no existen
        await sequelize.sync();
        console.log("Migraciones y modelos sincronizados con la base de datos.");

        app.listen(PORT, () => {
            console.log(`Servidor de Skinker Nube corriendo en http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error("No se pudo conectar a la base de datos:", error);
    }
}

iniciarServidor();