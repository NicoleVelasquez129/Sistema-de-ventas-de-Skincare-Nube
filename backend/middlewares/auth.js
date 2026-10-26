const jwt = require("jsonwebtoken");

const verificarToken = (req, res, next) => {
    const [tipo, token] = (req.headers.authorization || "").split(" ");
    if (tipo !== "Bearer" || !token) {
        return res.status(401).json({ success: false, mensaje: "No autorizado", error: "Debe iniciar sesión." });
    }
    try {
        req.usuario = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ["HS256"] });
        next();
    } catch {
        return res.status(401).json({ success: false, mensaje: "No autorizado", error: "Sesión inválida o expirada." });
    }
};

const soloAdmin = (req, res, next) => {
    if (!req.usuario || req.usuario.rol !== "administrador") {
        return res.status(403).json({ success: false, mensaje: "Acceso denegado", error: "No tiene permisos para esta acción." });
    }
    next();
};
// Para rutas públicas que, con ?todos=true, devuelven datos solo para el administrador
const adminSiPideTodos = (req, res, next) => {
    if (req.query.todos !== "true") return next();
    verificarToken(req, res, () => soloAdmin(req, res, next));
};

module.exports = { verificarToken, soloAdmin, adminSiPideTodos };