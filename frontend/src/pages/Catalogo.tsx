// frontend/src/pages/Catalogo.tsx
import React, { useState, useEffect } from 'react';
import type { Categoria, Producto } from '../interfaces';
import { obtenerCategoriasAPI, obtenerProductosAPI, urlImagen } from '../services/apiService';

export const Catalogo: React.FC<{ onAddToCart: (item: Producto, qty: number) => void }> = ({ onAddToCart }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidadModal, setCantidadModal] = useState<number>(1);
  const [cantidades, setCantidades] = useState<{ [key: number]: number }>({});

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [resProd, resCat] = await Promise.all([
        obtenerProductosAPI(),
        obtenerCategoriasAPI()
      ]);
      setProductos(resProd);
      setCategorias(resCat);
    } catch (error) {
      console.error("Error al cargar datos del catálogo:", error);
    }
  };

  const productosFiltrados = categoriaSeleccionada
    ? productos.filter(p => p.id_categoria === categoriaSeleccionada)
    : productos;

  const handleCantidadChange = (id: number, delta: number) => {
    setCantidades(prev => {
      const actual = prev[id] || 1;
      const nuevo = Math.max(1, actual + delta);
      return { ...prev, [id]: nuevo };
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 bg-[#fdfbf7] min-h-screen">
      
      {/* Barra de Navegación de Categorías */}
      <div className="flex overflow-x-auto space-x-2 pb-4 mb-8 scrollbar-hide">
        <button
          onClick={() => setCategoriaSeleccionada(null)}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm ${
            categoriaSeleccionada === null
              ? 'text-white shadow-md'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
          style={categoriaSeleccionada === null ? { backgroundColor: '#68c3b7' } : {}}
        >
          Todas
        </button>
        {categorias?.map(cat => (
          <button
            key={cat.id_categoria}
            onClick={() => setCategoriaSeleccionada(cat.id_categoria)}
            className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all whitespace-nowrap shadow-sm ${
              categoriaSeleccionada === cat.id_categoria
                ? 'text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
            style={categoriaSeleccionada === cat.id_categoria ? { backgroundColor: '#68c3b7' } : {}}
          >
            {cat.nombre}
          </button>
        ))}
      </div>

      {/* Grid de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {productosFiltrados.map(prod => {
          const qty = cantidades[prod.id_producto] || 1;
          return (
            <div key={prod.id_producto} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                {/* Imagen Interactiva (Abre detalles) */}
                <div 
                  className="w-full h-48 bg-slate-50 rounded-xl overflow-hidden mb-4 cursor-pointer relative group flex items-center justify-center"
                  onClick={() => { setProductoSeleccionado(prod); setCantidadModal(1); }}
                >
                  {prod.imagen ? (
                    <img src={urlImagen(prod.imagen)} alt={prod.nombre} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <span className="text-slate-400 text-sm">Sin imagen</span>
                  )}
                  <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-full shadow">Ver Detalles</span>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-800 mb-1">{prod.nombre}</h3>
                <p className="text-slate-600 text-sm line-clamp-2 mb-3">{prod.descripcion}</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-extrabold text-slate-900">${Number(prod.precio).toFixed(2)}</span>
                  <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">Stock: {prod.stock}</span>
                </div>

                {/* Controles de Cantidad y Botón Comprar */}
                <div className="flex items-center space-x-2">
                  <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50">
                    <button 
                      onClick={() => handleCantidadChange(prod.id_producto, -1)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-l-xl font-bold"
                    >-</button>
                    <span className="px-3 text-sm font-semibold text-slate-800">{qty}</span>
                    <button 
                      onClick={() => handleCantidadChange(prod.id_producto, 1)}
                      className="px-3 py-2 text-slate-600 hover:bg-slate-200 rounded-r-xl font-bold"
                    >+</button>
                  </div>

                  <button
                    onClick={() => onAddToCart(prod, qty)}
                    className="flex-1 py-2.5 px-4 text-white text-sm font-semibold rounded-xl shadow-sm transition-transform active:scale-95"
                    style={{ backgroundColor: '#68c3b7' }}
                  >
                    Añadir
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalle del Producto (Ingredientes y Modo de uso) */}
      {productoSeleccionado && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setProductoSeleccionado(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 w-8 h-8 rounded-full flex items-center justify-center font-bold"
            >
              ✕
            </button>

            <div className="w-full h-56 bg-slate-50 rounded-2xl overflow-hidden mb-4 flex items-center justify-center">
              {productoSeleccionado.imagen ? (
                <img src={urlImagen(productoSeleccionado.imagen)} alt={productoSeleccionado.nombre} className="w-full h-full object-cover" />
              ) : (
                <span className="text-slate-400">Sin imagen</span>
              )}
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-2">{productoSeleccionado.nombre}</h2>
            <p className="text-slate-600 text-sm mb-4">{productoSeleccionado.descripcion}</p>

            {/* Secciones Adicionales Requeridas */}
            <div className="space-y-3 mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Ingredientes Principales</h4>
                <p className="text-xs text-slate-700">Ácido Hialurónico, Extractos botánicos naturales, Vitamina E, Agua purificada.</p>
              </div>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Modo de Uso</h4>
                <p className="text-xs text-slate-700">Aplicar de 3 a 5 gotas sobre el rostro limpio y seco por la mañana y noche. Masajear suavemente hasta su total absorción antes de la crema hidratante.</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-slate-900">${Number(productoSeleccionado.precio).toFixed(2)}</span>
              
              <button
                onClick={() => {
                  onAddToCart(productoSeleccionado, cantidadModal);
                  setProductoSeleccionado(null);
                }}
                className="px-6 py-3 text-white text-sm font-semibold rounded-xl shadow-sm transition-transform active:scale-95"
                style={{ backgroundColor: '#68c3b7' }}
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};