import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { guardarFacturaPDF, obtenerMisPedidosAPI, subirComprobanteAPI, urlImagen } from '../services/apiService';
import type { PedidoCliente } from '../services/apiService';
import { QrPagoFalso } from '../components/QrPagoFalso';

const dinero = (valor: number | string) => `$${Number(valor).toFixed(2)}`;

const describirEstado = (pedido: PedidoCliente) => {
  if (pedido.estado === 'anulada') return { texto: 'Anulado', clase: 'bg-stone-200 text-stone-700' };
  if (pedido.estado_pedido === 'pendiente') {
    if (pedido.mensaje_pago) return { texto: 'Pago no recibido', clase: 'bg-rose-100 text-rose-800' };
    if (pedido.comprobante_pago) return { texto: 'Comprobante en revisión', clase: 'bg-sky-100 text-sky-800' };
    return { texto: 'Falta tu comprobante', clase: 'bg-amber-100 text-amber-800' };
  }
  const etiquetas: Record<string, string> = { pagado: 'Pago confirmado', enviado: 'Enviado', entregado: 'Entregado' };
  return { texto: etiquetas[pedido.estado_pedido] ?? pedido.estado_pedido, clase: 'bg-emerald-100 text-emerald-800' };
};

export const MisPedidos: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoCliente[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [archivos, setArchivos] = useState<Record<number, File | null>>({});
  const [enviando, setEnviando] = useState<number | null>(null);
  const [descargando, setDescargando] = useState<number | null>(null);

  const cargar = useCallback(async () => {
    try {
      setPedidos(await obtenerMisPedidosAPI());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar tus pedidos.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const enviar = async (idVenta: number) => {
    const archivo = archivos[idVenta];
    if (!archivo) return;
    setEnviando(idVenta);
    setError('');
    try {
      await subirComprobanteAPI(idVenta, archivo);
      setArchivos(actual => ({ ...actual, [idVenta]: null }));
      await cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo enviar el comprobante.');
    } finally {
      setEnviando(null);
    }
  };

  const descargar = async (idVenta: number) => {
    setDescargando(idVenta);
    setError('');
    try {
      await guardarFacturaPDF(idVenta);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo descargar el ticket.');
    } finally {
      setDescargando(null);
    }
  };

  return (
    <section className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 font-serif text-2xl font-bold text-stone-900">Mis pedidos</h1>
      {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
      {cargando && <p className="text-sm text-stone-500">Cargando…</p>}
      {!cargando && pedidos.length === 0 && (
        <p className="text-sm text-stone-600">
          Aún no tienes pedidos. <Link to="/" className="font-semibold underline">Ir al catálogo</Link>
        </p>
      )}

      <div className="space-y-4">
        {pedidos.map(pedido => {
          const estado = describirEstado(pedido);
          const porPagar = pedido.estado === 'registrada' && pedido.estado_pedido === 'pendiente';
          return (
            <article key={pedido.id_venta} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
              <header className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-semibold text-stone-900">Pedido #{pedido.id_venta}</p>
                  <p className="text-xs text-stone-500">{new Date(pedido.fecha).toLocaleString('es-BO')}</p>
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${estado.clase}`}>{estado.texto}</span>
              </header>

              <ul className="mt-3 space-y-1 text-sm text-stone-700">
                {pedido.detalles.map(detalle => (
                  <li key={detalle.id_detalle} className="flex justify-between">
                    <span>{detalle.cantidad} × {detalle.Producto?.nombre ?? 'Producto'}</span>
                    <span>{dinero(detalle.subtotal)}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 flex justify-between border-t border-stone-100 pt-2 text-sm font-semibold text-stone-900">
                <span>Total (envío {Number(pedido.envio) > 0 ? dinero(pedido.envio) : 'gratis'})</span>
                <span>{dinero(pedido.total)}</span>
              </p>

              {pedido.mensaje_pago && (
                <p role="alert" className="mt-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  Mensaje del vendedor: {pedido.mensaje_pago}
                </p>
              )}

              {pedido.comprobante_pago && (
                <a href={urlImagen(pedido.comprobante_pago)} target="_blank" rel="noreferrer" className="mt-3 inline-block text-sm font-semibold text-stone-700 underline">
                  Ver comprobante enviado
                </a>
              )}

              {pedido.estado === 'registrada' && pedido.estado_pedido !== 'pendiente' && (
                <button
                  type="button"
                  onClick={() => descargar(pedido.id_venta)}
                  disabled={descargando === pedido.id_venta}
                  className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primaryFocus disabled:opacity-50"
                >
                  {descargando === pedido.id_venta ? 'Descargando…' : 'Descargar ticket PDF'}
                </button>
              )}

              {porPagar && (
                <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
                  <details>
                    <summary className="cursor-pointer text-sm font-semibold text-stone-700">Ver QR de pago</summary>
                    <div className="mt-3 flex justify-center"><QrPagoFalso semilla={pedido.id_venta} /></div>
                    <p className="mt-2 text-center text-xs text-stone-500">
                      QR ilustrativo; no procesa pagos. Paga por el canal indicado por la tienda.
                    </p>
                  </details>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={e => setArchivos(actual => ({ ...actual, [pedido.id_venta]: e.target.files?.[0] ?? null }))}
                    className="w-full text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => enviar(pedido.id_venta)}
                    disabled={!archivos[pedido.id_venta] || enviando === pedido.id_venta}
                    className="rounded-xl bg-stone-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-50"
                  >
                    {enviando === pedido.id_venta ? 'Enviando…' : pedido.comprobante_pago ? 'Enviar otro comprobante' : 'Enviar comprobante'}
                  </button>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
};
