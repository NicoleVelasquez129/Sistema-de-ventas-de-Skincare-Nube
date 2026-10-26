const subirImagenProducto = (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            mensaje: "Error al subir la imagen",
            error: "Debe enviar un archivo en el campo 'imagen'."
        });
    }
    return res.status(201).json({
        success: true,
        mensaje: "Imagen subida con éxito",
        data: { ruta: `/uploads/${req.file.filename}` }
    });
};

module.exports = { subirImagenProducto };