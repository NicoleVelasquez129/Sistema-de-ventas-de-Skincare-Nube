// Reglas de validación compartidas por los servicios
const LETRAS = "A-Za-zÁÉÍÓÚÜÑáéíóúüñ";
const REGEX_NOMBRE = new RegExp(`^[${LETRAS} ]{2,150}$`);
const REGEX_CATEGORIA = new RegExp(`^[${LETRAS} ]{2,100}$`);
const REGEX_CELULAR = /^\d{8}$/;
const REGEX_CARNET = /^[A-Za-z0-9]+(-[A-Za-z0-9]+)?$/;

const nombreValido = (valor) => typeof valor === "string" && REGEX_NOMBRE.test(valor.trim());
const categoriaValida = (valor) => typeof valor === "string" && REGEX_CATEGORIA.test(valor.trim());
const celularValido = (valor) => typeof valor === "string" && REGEX_CELULAR.test(valor.trim());
const carnetValido = (valor) =>
    typeof valor === "string" && valor.trim().length >= 5 && valor.trim().length <= 20 && REGEX_CARNET.test(valor.trim());
const direccionValida = (valor) =>
    typeof valor === "string" && valor.trim().length >= 5 && valor.trim().length <= 255;

module.exports = { nombreValido, categoriaValida, celularValido, carnetValido, direccionValida };
