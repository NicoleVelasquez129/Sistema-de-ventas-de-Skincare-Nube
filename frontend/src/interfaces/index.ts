export interface Categoria {
  id_categoria: number;
  nombre: string;
  descripcion?: string;
}

export interface Producto {
  id_producto: number;
  nombre: string;
  descripcion?: string;
  id_categoria?: number;
  imagen?: string;
  precio: number;
  stock: number;
  stock_minimo: number;
  activo: boolean;
  Categoria?: {
    nombre: string;
  };
}

export interface Cliente {
  id_cliente: number;
  nombre: string;
  telefono?: string;
  correo?: string;
}

export interface ItemVenta {
  id_producto: number;
  cantidad: number;
}