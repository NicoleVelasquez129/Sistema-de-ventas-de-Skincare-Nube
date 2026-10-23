const validateId = (req, res, next) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            mensaje: "ID inválido",
            error: "El identificador debe ser un número entero positivo."
        });
    }
    req.params.id = id;
    next();
};

module.exports = { validateId };