const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const CARPETA_UPLOADS = path.join(__dirname, "..", "uploads");
fs.mkdirSync(CARPETA_UPLOADS, { recursive: true });

// La extensión sale del tipo de archivo, nunca del nombre que envía el usuario
const EXTENSIONES = { "image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp" };
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

const almacenamiento = multer.diskStorage({
    destination: (req, file, cb) => cb(null, CARPETA_UPLOADS),
    filename: (req, file, cb) => {
        const nombre = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${EXTENSIONES[file.mimetype]}`;
        cb(null, nombre);
    }
});

const upload = multer({
    storage: almacenamiento,
    limits: { fileSize: MAX_BYTES, files: 1 },
    fileFilter: (req, file, cb) => {
        if (EXTENSIONES[file.mimetype]) return cb(null, true);
        cb(new Error("Solo se permiten imágenes JPG, PNG o WEBP."));
    }
});

// Campo del formulario: "imagen". Devuelve errores con el mismo formato del resto de la API.
const subirImagen = (req, res, next) => {
    upload.single("imagen")(req, res, (err) => {
        if (err) {
            const mensaje = err.code === "LIMIT_FILE_SIZE" ? "La imagen supera el máximo de 5 MB." : err.message;
            return res.status(400).json({ success: false, mensaje: "Error al subir la imagen", error: mensaje });
        }
        next();
    });
};

module.exports = { subirImagen };