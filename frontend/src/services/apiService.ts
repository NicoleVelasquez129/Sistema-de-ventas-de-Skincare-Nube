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

export const moverProductosAPI = async (ids: number[], id_categoria: number) => {
  const response = await fetch(`${API_URL}/productos/mover`, {
    method: 'PATCH',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, id_categoria }),
  });
  return await response.json();
};

// --- VENTAS ---
export const registrarVentaAPI = async (ventaData: {
  items: { id_producto: number; cantidad: number }[];
  carnet?: string;
  con_envio: boolean;
  direccion_entrega?: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
}) => {
  const response = await fetch(`${API_URL}/ventas`, {
    method: 'POST',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(ventaData),
  });
  return await response.json();
};

export const cancelarVentaAPI = async (idVenta: number) => {
  const response = await fetch(`${API_URL}/ventas/${idVenta}/cancelar`, {
    method: 'PATCH',
    headers: cabecerasAuth(),
  });
  return await response.json();
};

export interface VentaResumenAPI {
  id_venta: number;
  fecha: string;
  total: number | string;
  estado: string;
  estado_pedido?: string;
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

// --- VENTAS DEL VENDEDOR ---
export interface ClienteCarnet {
  id_cliente: number;
  nombre: string;
  carnet?: string | null;
  telefono?: string | null;
  correo?: string | null;
  direccion?: string | null;
}

// Devuelve el cliente si el carnet ya existe, o null si es un carnet nuevo
export const buscarClientePorCarnetAPI = async (carnet: string): Promise<ClienteCarnet | null> => {
  const response = await fetch(`${API_URL}/clientes/carnet/${encodeURIComponent(carnet.trim())}`, {
    headers: cabecerasAuth(),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || data?.mensaje || 'No se pudo buscar el cliente.');
  }
  return data.data || null;
};

export interface DatosVentaVendedor {
  cliente: { carnet?: string; nombre: string; telefono?: string; correo?: string; direccion?: string };
  items: { id_producto: number; cantidad: number }[];
}

export const registrarVentaVendedorAPI = async (
  datos: DatosVentaVendedor,
): Promise<{ id_venta: number; total: number; envio: number }> => {
  const response = await fetch(`${API_URL}/ventas/vendedor`, {
    method: 'POST',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || data?.mensaje || 'No se pudo registrar la venta.');
  }
  return data.data;
};

export const confirmarPagoAPI = async (idVenta: number, metodo: string) => {
  const response = await fetch(`${API_URL}/ventas/${idVenta}/pagos`, {
    method: 'POST',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ metodo }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || data?.mensaje || 'No se pudo confirmar el pago.');
  }
  return data.data;
};

export interface VentaVendedorAPI {
  id_venta: number;
  fecha: string;
  total: number | string;
  envio: number | string;
  estado: string;
  estado_pedido: 'pendiente' | 'pagado' | 'enviado' | 'entregado';
  Cliente?: { nombre: string; carnet?: string | null; telefono?: string | null } | null;
  pagos?: { id_pago: number; metodo: string; monto: number | string }[];
}

export const obtenerMisVentasAPI = async (): Promise<VentaVendedorAPI[]> => {
  const response = await fetch(`${API_URL}/ventas/mias`, { headers: cabecerasAuth() });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || data?.mensaje || 'No se pudieron cargar tus ventas.');
  }
  return data.data || [];
};

// --- PEDIDOS EN LÍNEA (cliente) ---
export interface PedidoCliente {
  id_venta: number;
  fecha: string;
  total: number | string;
  envio: number | string;
  estado: string;
  estado_pedido: 'pendiente' | 'pagado' | 'enviado' | 'entregado';
  direccion_entrega?: string | null;
  comprobante_pago?: string | null;
  mensaje_pago?: string | null;
  detalles: {
    id_detalle: number;
    cantidad: number;
    precio_unitario: number | string;
    subtotal: number | string;
    Producto?: { nombre: string; imagen?: string | null };
  }[];
}

export const subirComprobanteAPI = async (idVenta: number, archivo: File) => {
  const formulario = new FormData();
  formulario.append('comprobante', archivo);
  const response = await fetch(`${API_URL}/ventas/${idVenta}/comprobante`, {
    method: 'POST',
    headers: cabecerasAuth(), // sin Content-Type: el navegador lo define para archivos
    body: formulario,
  });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || data.mensaje || 'No se pudo enviar el comprobante.');
  return data;
};

export const obtenerMisPedidosAPI = async (): Promise<PedidoCliente[]> => {
  const response = await fetch(`${API_URL}/ventas/mis-pedidos`, { headers: cabecerasAuth() });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || data.mensaje || 'No se pudieron cargar tus pedidos.');
  return data.data || [];
};

// --- PEDIDOS EN LÍNEA (vendedor) ---
export interface PedidoEnLinea extends PedidoCliente {
  ubicacion_lat?: number | string | null;
  ubicacion_lng?: number | string | null;
  usuario?: { nombre: string; correo: string };
  Cliente?: { nombre: string; telefono?: string | null; correo?: string | null; carnet?: string | null; direccion?: string | null };
  pagos?: { monto: number | string; metodo: string; fecha: string }[];
}

export const obtenerPedidosEnLineaAPI = async (): Promise<PedidoEnLinea[]> => {
  const response = await fetch(`${API_URL}/ventas/en-linea`, { headers: cabecerasAuth() });
  const data = await response.json();
  if (!data.success) throw new Error(data.error || data.mensaje || 'No se pudieron cargar los pedidos en línea.');
  return data.data || [];
};

export const rechazarPagoAPI = async (idVenta: number, mensaje: string) => {
  const response = await fetch(`${API_URL}/ventas/${idVenta}/rechazar-pago`, {
    method: 'PATCH',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ mensaje }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) throw new Error(data?.error || data?.mensaje || 'No se pudo enviar el mensaje.');
  return data.data;
};

export const cambiarEstadoPedidoAPI = async (idVenta: number, estado_pedido: 'enviado') => {
  const response = await fetch(`${API_URL}/ventas/${idVenta}/estado`, {
    method: 'PATCH',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado_pedido }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) throw new Error(data?.error || data?.mensaje || 'No se pudo cambiar el estado.');
  return data.data;
};

export const guardarFacturaPDF = async (idVenta: number) => {
  const blob = await descargarFacturaAPI(idVenta);
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `Ticket_${idVenta}.pdf`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// --- VENDEDORES (administrador) ---
export interface VendedorAPI {
  id_usuario: number;
  nombre: string;
  correo: string;
  activo: boolean;
  ventas_pagadas: number;
  total_vendido: number;
}

export const obtenerVendedoresAPI = async (): Promise<VendedorAPI[]> => {
  const response = await fetch(`${API_URL}/usuarios/vendedores`, { headers: cabecerasAuth() });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || data?.mensaje || 'No se pudieron cargar los vendedores.');
  }
  return data.data || [];
};

export const crearVendedorAPI = async (datos: { nombre: string; correo: string; contrasena: string }) => {
  const response = await fetch(`${API_URL}/usuarios/vendedores`, {
    method: 'POST',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  return await response.json();
};

export const cambiarActivoVendedorAPI = async (id: number, activo: boolean) => {
  const response = await fetch(`${API_URL}/usuarios/vendedores/${id}/activo`, {
    method: 'PATCH',
    headers: { ...cabecerasAuth(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ activo }),
  });
  return await response.json();
};

export const obtenerVentasDeVendedorAPI = async (id: number): Promise<VentaVendedorAPI[]> => {
  const response = await fetch(`${API_URL}/usuarios/vendedores/${id}/ventas`, { headers: cabecerasAuth() });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.success) {
    throw new Error(data?.error || data?.mensaje || 'No se pudieron cargar las ventas del vendedor.');
  }
  return data.data || [];
};

// --- REPORTES (administrador) ---
export type TipoReporte = 'ventas' | 'ganancias' | 'inventario';
export type FormatoReporte = 'pdf' | 'excel';

export const descargarReporteAPI = async (
  tipo: TipoReporte,
  formato: FormatoReporte,
  filtros: { desde?: string; hasta?: string; agrupar?: 'dia' | 'mes' }
) => {
  const params = new URLSearchParams({ formato });
  if (tipo !== 'inventario') {
    params.set('desde', filtros.desde ?? '');
    params.set('hasta', filtros.hasta ?? '');
  }
  if (tipo === 'ventas') params.set('agrupar', filtros.agrupar ?? 'dia');

  const response = await fetch(`${API_URL}/reportes/${tipo}?${params.toString()}`, { headers: cabecerasAuth() });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error || data?.mensaje || 'No se pudo generar el reporte.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = `Reporte_${tipo}.${formato === 'pdf' ? 'pdf' : 'xlsx'}`;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};