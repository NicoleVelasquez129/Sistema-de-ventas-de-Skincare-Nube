import type { Producto, Cliente, Categoria } from '../interfaces';
import { cabecerasAuth } from './authService';

const API_URL = 'http://localhost:3000/api';
const API_ORIGIN = API_URL.replace(/\/api$/, '');

// Datos que el administrador puede guardar de un producto
export interface DatosProducto {
  nombre: string;
  descripcion?: string;
  imagen?: string | null;
  ingredientes?: string | null;
  modo_uso?: string | null;
  etiqueta?: string | null;
  precio: number;
  stock: number;
  stock_minimo: number;
  id_categoria: number;
  activo?: boolean;
}

// Las imágenes subidas se guardan como "/uploads/archivo.jpg": se completa con la dirección del backend
export const urlImagen = (ruta?: string | null): string => {
  if (!ruta) return '';
  return ruta.startsWith('/uploads/') ? `${API_ORIGIN}${ruta}` : ruta;
};

// --- PRODUCTOS ---
export const obtenerProductosAPI = async (incluirInactivos = false): Promise<Producto[]> => {
  try {
    const response = await fetch(`${API_URL}/productos${incluirInactivos ? '?todos=true' : ''}`, {
      headers: cabecerasAuth(),
    });
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    throw new Error('No se pudo conectar con el servidor para obtener productos.');
  }
};

export const crearProductoAPI = async (datos: DatosProducto) => {
  const response = await fetch(`${API_URL}/productos`, {
    method: 'POST',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return await response.json();
};

export const subirImagenAPI = async (archivo: File): Promise<string> => {
  const formulario = new FormData();
  formulario.append('imagen', archivo);
  const response = await fetch(`${API_URL}/upload`, {
    method: 'POST',
    headers: cabecerasAuth(), // sin Content-Type: el navegador lo define para archivos
    body: formulario,
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || data.mensaje || 'No se pudo subir la imagen.');
  return data.data.ruta as string;
};

export const eliminarProductoDefinitivoAPI = async (id: number) => {
  const response = await fetch(`${API_URL}/productos/${id}/definitivo`, {
    method: 'DELETE',
    headers: cabecerasAuth(),
  });
  return await response.json();
};

export const actualizarProductoAPI = async (id: number, datos: Partial<Producto> | Partial<DatosProducto>) => {
  const response = await fetch(`${API_URL}/productos/${id}`, {
    method: 'PUT',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return await response.json();
};

// --- CLIENTES ---
export const obtenerClientesAPI = async (): Promise<Cliente[]> => {
  try {
    const response = await fetch(`${API_URL}/clientes`, {
      headers: cabecerasAuth(),
    });
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    throw new Error('No se pudo conectar con el servidor para obtener clientes.');
  }
};

export const crearClienteAPI = async (clienteData: { nombre: string; telefono?: string; correo?: string }) => {
  const response = await fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(clienteData),
  });
  return await response.json();
};

// --- CATEGORÍAS ---
export const obtenerCategoriasAPI = async (): Promise<Categoria[]> => {
  try {
    const response = await fetch(`${API_URL}/categorias`, {
      headers: cabecerasAuth(),
    });
    const data = await response.json();
    return data.data || [];
  } catch (error) {
    throw new Error('No se pudo conectar con el servidor para obtener categorías.');
  }
};

export const crearCategoriaAPI = async (categoriaData: { nombre: string; descripcion?: string }) => {
  const response = await fetch(`${API_URL}/categorias`, {
    method: 'POST',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(categoriaData),
  });
  return await response.json();
};

export const actualizarCategoriaAPI = async (id: number, datos: { nombre: string; descripcion?: string }) => {
  const response = await fetch(`${API_URL}/categorias/${id}`, {
    method: 'PUT',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return await response.json();
};

export const eliminarCategoriaAPI = async (id: number) => {
  const response = await fetch(`${API_URL}/categorias/${id}`, {
    method: 'DELETE',
    headers: cabecerasAuth(),
  });
  return await response.json();
};

// --- VENTAS ---
export const registrarVentaAPI = async (ventaData: { id_cliente?: number; id_usuario?: number; items: { id_producto: number; cantidad: number }[] }) => {
  const response = await fetch(`${API_URL}/ventas`, {
    method: 'POST',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(ventaData),
  });
  return await response.json();
};

export interface VentaResumenAPI {
  id_venta: number;
  fecha: string;
  total: number | string;
  estado: string;
  detalles: {
    id_producto: number;
    cantidad: number;
    precio_unitario: number | string;
    subtotal: number | string;
    Producto?: Producto;
  }[];
}

export const obtenerVentasAPI = async (): Promise<VentaResumenAPI[]> => {
  const response = await fetch(`${API_URL}/ventas`, { headers: cabecerasAuth() });
  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || data.mensaje || 'No se pudieron cargar las ventas.');
  }
  return data.data || [];
};

export const descargarFacturaAPI = async (idVenta: number): Promise<Blob> => {
  const response = await fetch(`${API_URL}/ventas/${idVenta}/factura`, {
    headers: cabecerasAuth(),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || data?.mensaje || 'No se pudo descargar la factura PDF.');
  }
  return response.blob();
};