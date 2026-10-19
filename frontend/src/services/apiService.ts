import type { Producto, Cliente, Categoria } from '../interfaces';

const API_URL = 'http://localhost:3000/api';

// --- PRODUCTOS ---
export const obtenerProductosAPI = async (): Promise<Producto[]> => {
  try {
    const response = await fetch(`${API_URL}/productos`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    throw new Error("No se pudo conectar con el servidor para obtener productos.");
  }
};


// --- CLIENTES ---
export const obtenerClientesAPI = async (): Promise<Cliente[]> => {
  try {
    const response = await fetch(`${API_URL}/clientes`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    throw new Error("No se pudo conectar con el servidor para obtener clientes.");
  }
};

export const crearClienteAPI = async (clienteData: { nombre: string; telefono?: string; correo?: string }) => {
  const response = await fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(clienteData),
  });
  return await response.json();
};

// --- CATEGORÍAS ---
export const obtenerCategoriasAPI = async (): Promise<Categoria[]> => {
  try {
    const response = await fetch(`${API_URL}/categorias`);
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    throw new Error("No se pudo conectar con el servidor para obtener categorías.");
  }
};

export const crearCategoriaAPI = async (categoriaData: { nombre: string; descripcion?: string }) => {
  const response = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(categoriaData),
  });
  return await response.json();
};

// --- VENTAS ---
export const registrarVentaAPI = async (ventaData: { id_cliente: number; id_usuario: number; items: { id_producto: number; cantidad: number }[] }) => {
  const response = await fetch(`${API_URL}/ventas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ventaData),
  });
  return await response.json();
};