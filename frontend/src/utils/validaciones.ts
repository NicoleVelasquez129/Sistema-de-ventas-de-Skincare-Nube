const LETRAS = 'A-Za-zÁÉÍÓÚÜÑáéíóúüñ';

export const soloLetras = (valor: string) =>
  valor.replace(new RegExp(`[^${LETRAS} ]`, 'g'), '');

export const soloDigitos = (valor: string, maximo: number) =>
  valor.replace(/\D/g, '').slice(0, maximo);

export const nombreValido = (valor: string) =>
  new RegExp(`^[${LETRAS} ]{2,150}$`).test(valor.trim());

export const celularValido = (valor: string) => /^\d{8}$/.test(valor);

export const filtroCarnet = (valor: string) =>
  valor.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 20);

export const carnetValido = (valor: string) =>
  /^[A-Za-z0-9]+(-[A-Za-z0-9]+)?$/.test(valor) && valor.length >= 5 && valor.length <= 20;

export const categoriaValida = (valor: string) =>
  new RegExp(`^[${LETRAS} ]{2,100}$`).test(valor.trim());

export const direccionValida = (valor: string) => valor.trim().length >= 5;
