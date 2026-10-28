// frontend/src/pages/Catalogo.tsx
import React, { useState, useEffect } from 'react';
import type { Categoria, Producto } from '../interfaces';
import { obtenerCategoriasAPI, obtenerProductosAPI, urlImagen } from '../services/apiService';

export const Catalogo: React.FC<{ onAddToCart: (item: Producto, qty: number) => void }> = ({ onAddToCart }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState('');//examen
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

  const productosFiltrados = productos.filter(p => {
    const coincideCategoria = categoriaSeleccionada ? p.id_categoria === categoriaSeleccionada : true;
    const texto = busqueda.trim().toLowerCase();
    const coincideBusqueda = !texto || p.nombre.toLowerCase().includes(texto) || String(p.id_producto).includes(texto);
    return coincideCategoria && coincideBusqueda;//examen
  });

  const handleCantidadChange = (id: number, delta: number) => {
    setCantidades(prev => {
      const actual = prev[id] || 1;
      const nuevo = Math.max(1, actual + delta);
      return { ...prev, [id]: nuevo };
    });
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffdf9_0%,_#f7f1ea_35%,_#f3eee8_100%)] px-4 py-8 text-slate-800">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 rounded-[28px] border border-[#eadfce] bg-white/70 p-4 shadow-[0_18px_45px_rgba(95,78,62,0.08)] backdrop-blur-md sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex overflow-x-auto pb-1 scrollbar-hide">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCategoriaSeleccionada(null)}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
                    categoriaSeleccionada === null
                      ? 'bg-[#68c3b7] text-white shadow-[0_10px_20px_rgba(104,195,183,0.28)]'
                      : 'border border-[#e6dfd5] bg-white text-slate-600 hover:border-[#cfc2ad] hover:text-slate-800'
                  }`}
                >
                  Todas
                </button>
                {categorias?.map(cat => (
                  <button
                    key={cat.id_categoria}
                    onClick={() => setCategoriaSeleccionada(cat.id_categoria)}
                    className={`rounded-full px-5 py-2.5 text-sm font-semibold whitespace-nowrap transition-all ${
                      categoriaSeleccionada === cat.id_categoria
                        ? 'bg-[#68c3b7] text-white shadow-[0_10px_20px_rgba(104,195,183,0.28)]'
                        : 'border border-[#e6dfd5] bg-white text-slate-600 hover:border-[#cfc2ad] hover:text-slate-800'
                    }`}
                  >
                    {cat.nombre}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative w-full max-w-md xl:w-[380px]">
              <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">⌕</span>
              <input
                type="search"
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder="Buscar por nombre o código…"
                aria-label="Buscar producto por nombre o código"
                className="w-full rounded-full border border-[#e7ddd0] bg-[#faf7f2] 
                py-3 pl-11 pr-4 text-sm text-slate-700 shadow-inner shadow-white/80 outline-none transition 
                focus:border-[#b9a68a] focus:bg-white focus:ring-4 focus:ring-[#d9c9ae]/30"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {productosFiltrados.map(prod => {
          const qty = cantidades[prod.id_producto] || 1;
          return (
            <div key={prod.id_producto} className="group flex flex-col justify-between rounded-[28px] border border-[#f0e6dc] bg-white/85 p-4 shadow-[0_18px_35px_rgba(97,79,62,0.08)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_22px_40px_rgba(97,79,62,0.12)]">
              <div>
                <div 
                  className="relative mb-4 h-52 overflow-hidden rounded-[22px] bg-[#f6f1ea]"
                  onClick={() => { setProductoSeleccionado(prod); setCantidadModal(1); }}
                >
                  {prod.imagen ? (
                    <img src={urlImagen(prod.imagen)} alt={prod.nombre} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="flex h-full items-center justify-center text-sm text-slate-400">Sin imagen</span>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700 shadow">Ver Detalles</span>
                  </div>
                </div>

                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-800">{prod.nombre}</h3>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-400">{prod.Categoria?.nombre ?? 'Skincare'}</p>
                  </div>
                  <span className="rounded-full bg-[#f1eee9] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">#{prod.id_producto}</span>
                </div>

                <p className="mb-4 line-clamp-2 text-sm leading-6 text-slate-600">{prod.descripcion}</p>
              </div>

              <div>
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-[1.65rem] font-black tracking-tight text-slate-900">${Number(prod.precio).toFixed(2)}</span>
                  <span className="rounded-full bg-[#eef4ee] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5c7a66]">Stock: {prod.stock}</span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center overflow-hidden rounded-full border border-[#e7ddcf] bg-[#faf7f1]">
                    <button 
                      onClick={() => handleCantidadChange(prod.id_producto, -1)}
                      className="px-3 py-2 text-lg font-medium text-slate-600 transition hover:bg-[#efe7de]"
                    >−</button>
                    <span className="min-w-[2.5rem] px-2 text-center text-sm font-semibold text-slate-800">{qty}</span>
                    <button 
                      onClick={() => handleCantidadChange(prod.id_producto, 1)}
                      className="px-3 py-2 text-lg font-medium text-slate-600 transition hover:bg-[#efe7de]"
                    >+</button>
                  </div>

                  <button
                    onClick={() => onAddToCart(prod, qty)}
                    className="flex-1 rounded-full bg-[#68c3b7] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(104,195,183,0.3)] transition hover:bg-[#4bb3a8] active:scale-[0.99]"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-[30px] bg-white p-6 shadow-[0_28px_60px_rgba(33,28,23,0.18)]">
            <button 
              onClick={() => setProductoSeleccionado(null)}
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-[#f5efe8] text-lg font-semibold text-slate-500 transition hover:bg-[#ece3d7] hover:text-slate-700"
            >
              ✕
            </button>

            <div className="mb-4 h-60 overflow-hidden rounded-[24px] bg-[#f8f3ed]">
              {productoSeleccionado.imagen ? (
                <img src={urlImagen(productoSeleccionado.imagen)} alt={productoSeleccionado.nombre} className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-slate-400">Sin imagen</span>
              )}
            </div>

            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold text-slate-900">{productoSeleccionado.nombre}</h2>
              <span className="rounded-full bg-[#eef4ee] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-[#5c7a66]">#{productoSeleccionado.id_producto}</span>
            </div>
            <p className="mb-5 text-sm leading-6 text-slate-600">{productoSeleccionado.descripcion}</p>

            <div className="mb-6 space-y-3 rounded-[24px] border border-[#f0e6dc] bg-[#faf7f2] p-4">
              <div>
                <h4 className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Ingredientes Principales</h4>
                <p className="text-sm text-slate-700">Ácido Hialurónico, Extractos botánicos naturales, Vitamina E, Agua purificada.</p>
              </div>
              <div>
                <h4 className="mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">Modo de Uso</h4>
                <p className="text-sm text-slate-700">Aplicar de 3 a 5 gotas sobre el rostro limpio y seco por la mañana y noche. Masajear suavemente hasta su total absorción antes de la crema hidratante.</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <span className="text-3xl font-black tracking-tight text-slate-900">${Number(productoSeleccionado.precio).toFixed(2)}</span>
              <button
                onClick={() => {
                  onAddToCart(productoSeleccionado, cantidadModal);
                  setProductoSeleccionado(null);
                }}
                className="rounded-full bg-[#68c3b7] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(104,195,183,0.3)] transition hover:bg-[#4bb3a8] active:scale-[0.99]"
              >
                Agregar al Carrito
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  </div>
  );
};