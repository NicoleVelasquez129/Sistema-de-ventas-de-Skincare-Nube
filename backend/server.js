const express = require("express");
const path = require("path");
const cors = require("cors");
const sequelize = require("./config/database");
require("dotenv").config();
if (!process.env.JWT_SECRET) {
    console.error("Falta JWT_SECRET en el archivo .env");
    process.exit(1);
}
const helmet = require("helmet");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares transversales
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173" }));
app.use(express.json());

// Imágenes subidas por el administrador (se permite mostrarlas desde el frontend, que corre en otro puerto)
app.use("/uploads", (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
}, express.static(path.join(__dirname, "uploads"), { dotfiles: "deny", index: false }));

// Importar Rutas REST
const productRoutes = require("./routes/productRoutes");
const saleRoutes = require("./routes/saleRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const clientRoutes = require("./routes/clientRoutes");
const userRoutes = require("./routes/userRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

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
            "GET /api/usuarios": "Lista los usuarios del sistema (solo administrador)",
            "POST /api/auth/login": "Inicia sesión y devuelve un token de acceso",
            "POST /api/upload": "Sube una imagen de producto (solo administrador)"
        }
    });
});

// Enrutar endpoints principales
app.use("/api/auth", authRoutes);
app.use("/api/productos", productRoutes);
app.use("/api/ventas", saleRoutes);
app.use("/api/categorias", categoryRoutes);
app.use("/api/clientes", clientRoutes);
app.use("/api/usuarios", userRoutes);
app.use("/api/upload", uploadRoutes);

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