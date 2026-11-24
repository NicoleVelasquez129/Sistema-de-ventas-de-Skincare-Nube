// frontend/src/components/Canastita.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import type { CartItem } from '../interfaces';
import { registrarVentaAPI, subirComprobanteAPI, urlImagen } from '../services/apiService';
import { QrPagoFalso } from './QrPagoFalso';
import { obtenerToken, obtenerUsuarioGuardado } from '../services/authService';
import { direccionValida } from '../utils/validaciones';

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


  const [direccion, setDireccion] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [buscandoGps, setBuscandoGps] = useState(false);
  const [errorGps, setErrorGps] = useState('');
  const [totalPagado, setTotalPagado] = useState(0);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [comprobanteEnviado, setComprobanteEnviado] = useState(false);

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
    setArchivo(null);
    setComprobanteEnviado(false);
    setVentaId(null);
    setErrorCompra('');
    onCerrar();
  };

  const usarMiUbicacion = () => {
    if (!navigator.geolocation) {
      setErrorGps('Tu navegador no permite obtener la ubicación.');
      return;
    }
    setBuscandoGps(true);
    setErrorGps('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setCoords({ lat: Number(pos.coords.latitude.toFixed(7)), lng: Number(pos.coords.longitude.toFixed(7)) });
        setBuscandoGps(false);
      },
      () => {
        setErrorGps('No se pudo obtener tu ubicación. Revisa el permiso del navegador o escribe tu dirección.');
        setBuscandoGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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

    setErrorCompra('');
    if (!direccion.trim() && !coords) {
      setErrorCompra('Para continuar con el pago escribe tu dirección o usa tu ubicación actual (puedes poner ambas).');
      return;
    }
    if (direccion.trim() && !direccionValida(direccion)) {
      setErrorCompra('La dirección debe tener al menos 5 caracteres.');
      return;
    }

    setProcesando(true);
    try {
      const response = await registrarVentaAPI({
        items: items.map(({ producto, cantidad }) => ({
          id_producto: producto.id_producto,
          cantidad,
        })),
        con_envio: true,
        direccion_entrega: direccion.trim() || undefined,
        ubicacion_lat: coords ? coords.lat : undefined,
        ubicacion_lng: coords ? coords.lng : undefined,
      });
      
      if (!response.success) {
        throw new Error(response.error || response.mensaje || 'No se pudo procesar la compra.');
      }

      const idRegistrado = Number(response.data?.id_venta);
      if (!Number.isInteger(idRegistrado) || idRegistrado <= 0) {
        throw new Error('La venta se registró, pero no se recibió su número de pedido.');
      }

      setVentaId(idRegistrado);
      setTotalPagado(Number(response.data?.total) || total);
      setArchivo(null);
      setComprobanteEnviado(false);
      onVentaCompletada();
      localStorage.removeItem('carrito_pendiente');
    } catch (error) {
      setErrorCompra(error instanceof Error ? error.message : 'Error al procesar la compra.');
    } finally {
      setProcesando(false);
    }
  };

  const enviarComprobante = async () => {
    if (!ventaId || !archivo) return;
    setSubiendo(true);
    setErrorCompra('');
    try {
      await subirComprobanteAPI(ventaId, archivo);
      setComprobanteEnviado(true);
    } catch (error) {
      setErrorCompra(error instanceof Error ? error.message : 'No se pudo enviar el comprobante.');
    } finally {
      setSubiendo(false);
    }
  };

  const irAMisPedidos = () => {
    cerrarCanastita();
    navigate('/mis-pedidos');
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
              <span className="font-sans text-sm font-normal text-stone-600">
                ({cantidadTotal} {cantidadTotal === 1 ? 'ítem' : 'ítems'})
              </span>
            </h2>
          </div>
          <button
            type="button"
            onClick={cerrarCanastita}
            aria-label="Cerrar canastita"
            className="rounded-full p-2 text-stone-600 transition-colors hover:bg-stone-200/70 hover:text-stone-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="flex flex-1 flex-col overflow-y-auto">
        {/* Lista de productos */}
        {ventaId ? (
          <div className="flex flex-1 flex-col items-center gap-4 px-6 py-8 text-center">
            <p role="status" className="font-serif text-xl font-bold text-stone-900">¡Pedido registrado!</p>
            <p className="text-sm text-stone-600">
              Pedido <span className="font-semibold">#{ventaId}</span> · Total a pagar{' '}
              <span className="font-semibold">{dinero(totalPagado)}</span>
            </p>
            <QrPagoFalso semilla={ventaId} />
            <p className="text-xs text-stone-600">
              Este QR es ilustrativo y no procesa pagos. Realiza el pago por el canal indicado por la tienda y luego sube tu comprobante.
              Tu pedido se prepara cuando el vendedor confirme el pago.
            </p>

            {comprobanteEnviado ? (
              <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                Comprobante enviado. El vendedor lo revisará.
              </p>
            ) : (
              <div className="w-full space-y-2">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={e => setArchivo(e.target.files?.[0] ?? null)}
                  className="w-full text-sm"
                />
                <button
                  type="button"
                  onClick={enviarComprobante}
                  disabled={!archivo || subiendo}
                  className="w-full rounded-xl bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-stone-800 disabled:opacity-50"
                >
                  {subiendo ? 'Enviando…' : 'Enviar comprobante'}
                </button>
              </div>
            )}

            {errorCompra && <p role="alert" className="text-sm text-rose-700">{errorCompra}</p>}

            <button type="button" onClick={irAMisPedidos} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primaryFocus">
              Ver mis pedidos
            </button>
            <button type="button" onClick={cerrarCanastita} className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-nube-oscuro ring-1 ring-primary/60 transition hover:bg-primary/15">
              Seguir viendo productos
            </button>
          </div>
        ) : vacia ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <svg className="h-14 w-14 text-stone-300" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 7h12l1 13H5L6 7zM9 7a3 3 0 016 0" />
            </svg>
            <p className="font-serif text-lg font-bold text-stone-800">Tu canastita está vacía</p>
            <p className="text-sm text-stone-600">Agrega productos desde el catálogo para verlos aquí.</p>
            <button
              type="button"
              onClick={cerrarCanastita}
              className="mt-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primaryFocus"
            >
              Seguir viendo productos
            </button>
          </div>
        ) : (
          <ul className="flex-1 space-y-4 px-6 py-6">
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
                      <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-600">Sin imagen</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-serif text-[15px] font-bold text-stone-900" title={producto.nombre}>
                      {producto.nombre}
                    </p>
                    <p className="text-sm text-stone-600">{dinero(precio)} c/u</p>

                    <div className="mt-2 flex items-center gap-3">
                      <div className="flex items-center rounded-lg border border-stone-200 bg-white">
                        <button
                          type="button"
                          onClick={() => onCambiarCantidad(producto.id_producto, -1)}
                          disabled={cantidad <= 1}
                          aria-label={`Quitar una unidad de ${producto.nombre}`}
                          className="px-2 py-1 text-stone-600 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
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
                          className="px-2 py-1 text-stone-600 transition-colors hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40"
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
                        className="rounded-md p-1 text-stone-600 transition-colors hover:text-rose-600"
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
          <footer className="shrink-0 border-t border-stone-200 bg-nube-crema px-6 pb-6 pt-5">
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

            <div className="mb-5 space-y-3">

              <div className="space-y-2 rounded-xl border border-stone-200 bg-white p-3">
                <label htmlFor="c-dir" className="block text-xs font-semibold text-stone-600">Dirección de entrega (obligatoria)</label>
                <input id="c-dir" maxLength={255} value={direccion} onChange={e => setDireccion(e.target.value)}
                  className="w-full rounded-xl border border-stone-200 px-3 py-2 text-sm" />
                <button type="button" onClick={usarMiUbicacion} disabled={buscandoGps}
                  className="w-full rounded-xl bg-stone-100 px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-200 disabled:opacity-60">
                  {buscandoGps ? 'Buscando ubicación…' : '📍 Usar mi ubicación actual'}
                </button>
                {coords && <p className="text-xs text-emerald-700">Ubicación capturada: Lat {coords.lat}, Lng {coords.lng}</p>}
                {errorGps && <p role="alert" className="text-xs text-rose-700">{errorGps}</p>}
              </div>
            </div>

            <dl className="space-y-2 text-sm text-stone-600">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd className="font-semibold text-stone-800">{dinero(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Envío estimado</dt>
                <dd className={envioGratis ? 'font-bold text-emerald-700' : 'font-semibold text-stone-800'}>
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
        </div>
      </aside>
    </div>
  );
};