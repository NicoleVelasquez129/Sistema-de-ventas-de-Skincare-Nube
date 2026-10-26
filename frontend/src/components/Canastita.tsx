// frontend/src/components/Canastita.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CartItem } from '../interfaces';
import { descargarFacturaAPI, registrarVentaAPI, urlImagen } from '../services/apiService';
import { obtenerToken, obtenerUsuarioGuardado } from '../services/authService';

const ENVIO_GRATIS_DESDE = 100;
const COSTO_ENVIO = 15;

interface CanastitaProps {
  abierto: boolean;
  onCerrar: () => void;
  items: CartItem[];
  subtotal: number;
  onCambiarCantidad: (idProducto: number, delta: number) => void;
  onQuitar: (idProducto: number) => void;
  onVentaCompletada: () => void;
}

const dinero = (valor: number) => `$${valor.toFixed(2)}`;

export const Canastita: React.FC<CanastitaProps> = ({
  abierto,
  onCerrar,
  items,
  subtotal,
  onCambiarCantidad,
  onQuitar,
  onVentaCompletada,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [ventaId, setVentaId] = useState<number | null>(null);
  const [errorCompra, setErrorCompra] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [descargando, setDescargando] = useState(false);

  useEffect(() => {
    if (!abierto) return;
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', alPresionar);
    return () => window.removeEventListener('keydown', alPresionar);
  }, [abierto, onCerrar]);

  useEffect(() => {
    if (location.pathname !== '/' && abierto) onCerrar();
  }, [location.pathname, abierto, onCerrar]);

  if (!abierto || location.pathname !== '/') return null;

  const cantidadTotal = items.reduce((total, item) => total + item.cantidad, 0);
  const vacia = items.length === 0;
  const envioGratis = subtotal >= ENVIO_GRATIS_DESDE;
  const envio = vacia || envioGratis ? 0 : COSTO_ENVIO;
  const total = subtotal + envio;
  const faltaParaGratis = Math.max(0, ENVIO_GRATIS_DESDE - subtotal);
  const progreso = Math.min(100, (subtotal / ENVIO_GRATIS_DESDE) * 100);

  const cerrarCanastita = () => {
    setVentaId(null);
    setErrorCompra('');
    onCerrar();
  };

  const handleProcederPago = async () => {
    const token = obtenerToken();
    const usuario = obtenerUsuarioGuardado();
    if (!token || !usuario) {
      localStorage.setItem('carrito_pendiente', JSON.stringify(items));
      cerrarCanastita();
      navigate('/login', { state: { desde: '/' } });
      return;
    }

    setProcesando(true);
    setErrorCompra('');
    try {
      const response = await registrarVentaAPI({
        items: items.map(({ producto, cantidad }) => ({
          id_producto: producto.id_producto,
          cantidad,
        })),
      });
      if (!response.success) {
        throw new Error(response.error || response.mensaje || 'No se pudo procesar la compra.');
      }

      const idRegistrado = Number(response.data?.id_venta);
      if (!Number.isInteger(idRegistrado) || idRegistrado <= 0) {
        throw new Error('La venta se registró, pero no se recibió su número de pedido.');
      }

      setVentaId(idRegistrado);
      onVentaCompletada();
      localStorage.removeItem('carrito_pendiente');
    } catch (error) {
      setErrorCompra(error instanceof Error ? error.message : 'Error al procesar la compra.');
    } finally {
      setProcesando(false);
    }
  };

  const descargarPDF = async (idVenta: number) => {
    setDescargando(true);
    setErrorCompra('');
    try {
      const blob = await descargarFacturaAPI(idVenta);
      const url = URL.createObjectURL(blob);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `Factura_${idVenta}.pdf`;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      setErrorCompra(error instanceof Error ? error.message : 'No se pudo descargar la factura PDF.');
    } finally {
      setDescargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]" onClick={cerrarCanastita}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Tu canastita"
        className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl"
        onClick={event => event.stopPropagation()}
      >
        {/* Encabezado */}
        <header className="flex items-center justify-between border-b border-stone-200 bg-nube-crema px-6 py-5">
          <div className="flex items-center gap-3">
            <svg className="h-6 w-6 text-rose-500" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0" />
            </svg>
            <h2 className="font-serif text-xl font-bold text-stone-900">
              Tu Canastita{' '}
              <span className="font-sans text-sm font-normal text-stone-500">
                ({cantidadTotal} {cantidadTotal === 1 ? 'ítem' : 'ítems'})
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={cerrarCanastita}
            aria-label="Cerrar canastita"
            className="rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-200/70 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        {/* Lista de productos */}
        {ventaId ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p role="status" className="font-serif text-xl font-bold text-stone-900">¡Compra registrada!</p>
            <p className="text-sm text-stone-600">Tu número de pedido es <span className="font-semibold">#{ventaId}</span>.</p>
            <button
              type="button"
              onClick={() => descargarPDF(ventaId)}
              disabled={descargando}
              className="rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-60"
            >
              {descargando ? 'Descargando…' : 'Descargar factura PDF'}
            </button>
            <button type="button" onClick={cerrarCanastita} className="text-sm font-semibold text-stone-600 hover:underline">
              Seguir viendo productos
            </button>
          </div>
        ) : vacia ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <svg className="h-14 w-14 text-stone-300" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0" />
            </svg>
            <p className="font-serif text-lg font-bold text-stone-800">Tu canastita está vacía</p>
            <p className="text-sm text-stone-500">Agrega productos desde el catálogo para verlos aquí.</p>
            <button
              type="button"
              onClick={cerrarCanastita}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primaryFocus"
            >
              Seguir viendo productos
            </button>
          </div>
        ) : (
          <ul className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
            {items.map(item => {
              const { producto, cantidad } = item;
              const precio = Number(producto.precio);
              const sinMas = cantidad >= producto.stock;
              return (
                <li
                  key={producto.id_producto}
                  className="flex items-center gap-4 rounded-2xl border border-stone-200 bg-stone-50/60 p-3"
                >
                  <div className="h-[72px] w-[72px] shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-white">
                    {producto.imagen ? (
                      <img src={urlImagen(producto.imagen)} alt={producto.nombre} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400">Sin imagen</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-[15px] font-bold text-stone-900" title={producto.nombre}>
                      {producto.nombre}
                    </p>
                    <p className="text-sm text-stone-400">{dinero(precio)} c/u</p>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-stone-200 bg-white">
                        <button
                          type="button"
                          onClick={() => onCambiarCantidad(producto.id_producto, -1)}
                          disabled={cantidad <= 1}
                          aria-label={`Quitar una unidad de ${producto.nombre}`}
                          className="px-2 py-1 text-stone-500 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" d="M5 12h14" />
                          </svg>
                        </button>
                        <span className="min-w-[1.75rem] text-center text-sm font-bold text-stone-900">{cantidad}</span>
                        <button
                          type="button"
                          onClick={() => onCambiarCantidad(producto.id_producto, 1)}
                          disabled={sinMas}
                          aria-label={`Agregar una unidad de ${producto.nombre}`}
                          title={sinMas ? 'Alcanzaste el stock disponible' : undefined}
                          className="px-2 py-1 text-stone-500 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                          </svg>
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => onQuitar(producto.id_producto)}
                        aria-label={`Quitar ${producto.nombre} de la canastita`}
                        className="rounded-md p-1 text-stone-400 transition-colors hover:text-rose-600"
                      >
                        <svg className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16M10 11v6M14 11v6M6 7l1 12a1 1 0 001 1h8a1 1 0 001-1l1-12M9 7V4h6v3" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <p className="self-start pt-1 font-serif text-base font-bold text-stone-900">{dinero(precio * cantidad)}</p>
                </li>
              );
            })}
          </ul>
        )}

        {/* Resumen */}
        {!vacia && !ventaId && (
          <footer className="border-t border-stone-200 bg-nube-crema px-6 pb-6 pt-5">
            {errorCompra && (
              <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {errorCompra}
              </p>
            )}
            {envioGratis ? (
              <div className="mb-5 flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                <svg className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span>¡Felicidades! Tienes envío gratis activado.</span>
              </div>
            ) : (
              <div className="mb-5 rounded-xl border border-stone-200 bg-white px-4 py-3">
                <p className="text-sm text-stone-700">
                  Te faltan <span className="font-bold text-stone-900">{dinero(faltaParaGratis)}</span> para el envío gratis.
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200">
                  <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progreso}%` }} />
                </div>
              </div>
            )}

            <dl className="space-y-2 text-sm text-stone-600">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-stone-800">{dinero(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Envío estimado</dt>
                <dd className={envioGratis ? 'font-bold text-emerald-600' : 'font-semibold text-stone-800'}>
                  {envioGratis ? 'GRATIS' : dinero(envio)}
                </dd>
              </div>
            </dl>

            <div className="mt-4 flex items-baseline justify-between border-t border-stone-200 pt-4">
              <span className="font-serif text-lg font-bold text-stone-900">Total General</span>
              <span className="font-serif text-2xl font-bold text-rose-600">{dinero(total)}</span>
            </div>

            <button
              type="button"
              onClick={handleProcederPago}
              disabled={procesando}
              className="mt-5 w-full rounded-2xl bg-stone-900 py-4 text-base font-semibold text-white transition-colors hover:bg-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              {procesando ? 'Procesando…' : 'Proceder al Pago'}
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
};