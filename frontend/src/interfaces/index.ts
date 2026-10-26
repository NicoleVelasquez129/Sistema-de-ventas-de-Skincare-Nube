export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string | null;
  Productos?: { id_producto: number; nombre: string }[];
}

export interface Cliente {
  id_cliente: number;
  nombre: string;
  telefono?: string;
  correo?: string;
}

export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion: string;
  ingredientes?: string;
  modo_uso?: string;
  precio: number;
  stock: number;
  imagen?: string;
  id_categoria: number;
  stock_minimo?: number;
  activo?: boolean;
  etiqueta?: string | null;
  Categoria?: { nombre: string };
}

export interface CartItem {
  producto: Producto;
  cantidad: number;
}