import React, { useCallback, useEffect, useState } from 'react';
import {
  cambiarEstadoPedidoAPI,
  confirmarPagoAPI,
  guardarFacturaPDF,
  obtenerPedidosEnLineaAPI,
  rechazarPagoAPI,
  urlImagen,
} from '../services/apiService';
import type { PedidoEnLinea } from '../services/apiService';

const dinero = (valor: number | string) => `$${Number(valor).toFixed(2)}`;

const PESTANAS: { id: string; etiqueta: string; filtro: (p: PedidoEnLinea) => boolean }[] = [
  { id: 'revisar', etiqueta: 'Por revisar', filtro: p => p.estado === 'registrada' && p.estado_pedido === 'pendiente' },
  { id: 'preparar', etiqueta: 'Por enviar', filtro: p => p.estado === 'registrada' && p.estado_pedido === 'pagado' },
  { id: 'enviados', etiqueta: 'Enviados', filtro: p => p.estado === 'registrada' && p.estado_pedido === 'enviado' },
  { id: 'anulados', etiqueta: 'Anulados', filtro: p => p.estado === 'anulada' },
];

const base = 'rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50';
const btnPrincipal = `${base} bg-nube-oscuro text-white shadow-sm hover:bg-primaryFocus`;
const btnSuave = `${base} bg-white text-nube-oscuro ring-1 ring-primary hover:bg-primary/10`;
const btnPeligro = `${base} bg-rose-50 text-rose-700 ring-1 ring-rose-300 hover:bg-rose-100`;
const btnMini = 'rounded-full bg-white px-3 py-1 text-xs font-semibold text-nube-oscuro ring-1 ring-primary/60 transition hover:bg-primary/15';

interface ModalProps {
  titulo: string;
  texto: string;
  textoConfirmar: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

const ModalConfirmar: React.FC<ModalProps> = ({ titulo, texto, textoConfirmar, onConfirmar, onCancelar }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 px-4" onClick={onCancelar}>
    <div
      role="dialog"
      aria-modal="true"
      aria-label={titulo}
      onClick={e => e.stopPropagation()}
      className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl"
    >
      <div className="bg-primary px-6 py-4">
        <h2 className="font-serif text-lg font-bold text-white">{titulo}</h2>
      </div>
      <div className="space-y-5 px-6 py-5">
        <p className="text-sm text-stone-700">{texto}</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCancelar} className={btnSuave}>Cancelar</button>
          <button type="button" onClick={onConfirmar} className={btnPrincipal}>{textoConfirmar}</button>
        </div>
      </div>
    </div>
  </div>
);

interface TarjetaProps {
  pedido: PedidoEnLinea;
  onCambio: () => void;
  onError: (mensaje: string) => void;
}

const TarjetaPedido: React.FC<TarjetaProps> = ({ pedido: p, onCambio, onError }) => {
  const [metodo, setMetodo] = useState('qr');
  const [rechazando, setRechazando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState('');
  const [modal, setModal] = useState(false);

  const ejecutar = async (accion: () => Promise<unknown>, recargar = true) => {
    setOcupado(true);
    try {
      await accion();
      if (recargar) onCambio();
    } catch (e) {
      onError(e instanceof Error ? e.message : 'No se pudo completar la acción.');
    } finally {
      setOcupado(false);
    }
  };

  const confirmarPago = () => {
    setModal(false);
    ejecutar(() => confirmarPagoAPI(p.id_venta, metodo));
  };

  const enviarMensaje = () =>
    ejecutar(async () => {
      await rechazarPagoAPI(p.id_venta, mensaje);
      setRechazando(false);
      setMensaje('');
    });

  const copiar = async (etiqueta: string, texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(etiqueta);
      window.setTimeout(() => setCopiado(''), 2000);
    } catch {
      onError('No se pudo copiar. Selecciona el texto y cópialo manualmente.');
    }
  };

  const nombre = p.Cliente?.nombre || p.usuario?.nombre || 'Cliente';
  const telefono = p.Cliente?.telefono;
  const direccion = p.direccion_entrega?.trim() || '';
  const lat = p.ubicacion_lat != null ? Number(p.ubicacion_lat) : null;
  const lng = p.ubicacion_lng != null ? Number(p.ubicacion_lng) : null;
  const tieneGps = lat !== null && lng !== null && Number.isFinite(lat) && Number.isFinite(lng);
  const esPdf = p.comprobante_pago?.toLowerCase().endsWith('.pdf');
  const registrada = p.estado === 'registrada';
  const pendiente = registrada && p.estado_pedido === 'pendiente';
  const pagado = registrada && p.estado_pedido !== 'pendiente';

  return (
    <article className="overflow-hidden rounded-2xl border border-primary/30 bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-2 bg-primary px-5 py-3 text-white">
        <div>
          <p className="font-semibold">Pedido #{p.id_venta} · {nombre}</p>
          <p className="text-xs text-white/90">{new Date(p.fecha).toLocaleString('es-BO')}</p>
        </div>
        <p className="text-lg font-bold">{dinero(p.total)}</p>
      </header>

      <div className="space-y-4 p-5">
        <p className="text-sm text-stone-700">
          {telefono ? <a href={`tel:${telefono}`} className="font-semibold text-nube-oscuro underline">{telefono}</a> : 'Sin celular registrado'}
          {p.Cliente?.correo ? ` · ${p.Cliente.correo}` : ''}
        </p>

        <ul className="space-y-1 rounded-xl bg-primary/10 p-3 text-sm text-stone-800">
          {p.detalles.map(d => (
            <li key={d.id_detalle} className="flex justify-between">
              <span>{d.cantidad} × {d.Producto?.nombre ?? 'Producto'}</span>
              <span>{dinero(d.subtotal)}</span>
            </li>
          ))}
        </ul>

        <div className="rounded-xl border border-primary/30 bg-nube-crema p-3 text-sm text-stone-700">
          <p className="font-semibold text-nube-oscuro">Entrega</p>
          {!direccion && !tieneGps && <p>Retiro en tienda (sin envío a domicilio).</p>}
          {direccion && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span>Dirección escrita: <span className="font-medium">{direccion}</span></span>
              <button type="button" onClick={() => copiar('dir', direccion)} className={btnMini}>
                {copiado === 'dir' ? 'Copiado' : 'Copiar'}
              </button>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(direccion)}`}
                target="_blank"
                rel="noreferrer"
                className={btnMini}
              >
                Buscar en el mapa
              </a>
            </div>
          )}
          {tieneGps && (
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <span>Ubicación GPS: <span className="font-medium">{lat}, {lng}</span></span>
              <button type="button" onClick={() => copiar('gps', `${lat}, ${lng}`)} className={btnMini}>
                {copiado === 'gps' ? 'Copiado' : 'Copiar'}
              </button>
              <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer" className={btnMini}>
                Abrir en el mapa
              </a>
            </div>
          )}
        </div>

        {pendiente && p.mensaje_pago && (
          <p className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800">
            Mensaje enviado al cliente: {p.mensaje_pago}. Esperando un nuevo comprobante.
          </p>
        )}

        {pendiente && (
          <div className="space-y-3 rounded-xl bg-primary/10 p-4">
            {p.comprobante_pago ? (
              <div>
                <p className="mb-2 text-sm font-semibold text-nube-oscuro">Comprobante del cliente</p>
                {esPdf ? (
                  <a href={urlImagen(p.comprobante_pago)} target="_blank" rel="noreferrer" className={`${btnMini} inline-block`}>
                    Abrir comprobante (PDF)
                  </a>
                ) : (
                  <a href={urlImagen(p.comprobante_pago)} target="_blank" rel="noreferrer">
                    <img
                      src={urlImagen(p.comprobante_pago)}
                      alt={`Comprobante del pedido ${p.id_venta}`}
                      className="max-h-64 rounded-lg border border-primary/30 bg-white"
                    />
                  </a>
                )}
              </div>
            ) : (
              <p className="text-sm font-medium text-amber-800">El cliente aún no subió su comprobante.</p>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={metodo}
                onChange={e => setMetodo(e.target.value)}
                aria-label="Método de pago"
                className="rounded-xl border border-primary/40 bg-white px-3 py-2 text-sm text-stone-800"
              >
                <option value="qr">QR</option>
                <option value="transferencia">Transferencia</option>
              </select>
              <button type="button" onClick={() => setModal(true)} disabled={ocupado || !p.comprobante_pago} className={btnPrincipal}>
                Confirmar pago
              </button>
              <button type="button" onClick={() => setRechazando(v => !v)} disabled={ocupado} className={btnPeligro}>
                Pago no recibido
              </button>
            </div>

            {rechazando && (
              <div className="space-y-2">
                <textarea
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  maxLength={255}
                  rows={2}
                  placeholder="Mensaje para el cliente (ej.: Tu pago aún no llegó a la cuenta)"
                  className="w-full rounded-xl border border-primary/40 bg-white px-3 py-2 text-sm"
                />
                <button type="button" onClick={enviarMensaje} disabled={ocupado || !mensaje.trim()} className={btnPrincipal}>
                  Enviar mensaje al cliente
                </button>
              </div>
            )}
          </div>
        )}

        {pagado && (
          <div className="flex flex-wrap gap-2">
            {p.estado_pedido === 'pagado' && (
              <button
                type="button"
                onClick={() => ejecutar(() => cambiarEstadoPedidoAPI(p.id_venta, 'enviado'))}
                disabled={ocupado}
                className={btnPrincipal}
              >
                Marcar como enviado
              </button>
            )}
            <button type="button" onClick={() => ejecutar(() => guardarFacturaPDF(p.id_venta), false)} disabled={ocupado} className={btnSuave}>
              Descargar ticket PDF
            </button>
          </div>
        )}
      </div>

      {modal && (
        <ModalConfirmar
          titulo={`Confirmar pago del pedido #${p.id_venta}`}
          texto={`Verifica que el comprobante o el dinero llegó a la cuenta antes de confirmar el pago de ${dinero(p.total)} por ${metodo === 'qr' ? 'QR' : 'transferencia'}.`}
          textoConfirmar="Sí, confirmar pago"
          onConfirmar={confirmarPago}
          onCancelar={() => setModal(false)}
        />
      )}
    </article>
  );
};

export const PedidosEnLinea: React.FC = () => {
  const [pedidos, setPedidos] = useState<PedidoEnLinea[]>([]);
  const [pestana, setPestana] = useState('revisar');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setPedidos(await obtenerPedidosEnLineaAPI());
      setError('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los pedidos en línea.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
    const id = window.setInterval(cargar, 30000);
    return () => window.clearInterval(id);
  }, [cargar]);

  const activa = PESTANAS.find(t => t.id === pestana) ?? PESTANAS[0];
  const visibles = pedidos.filter(activa.filtro);

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-primary/10">
      <section className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="font-serif text-2xl font-bold text-nube-oscuro">Pedidos en línea</h1>
          <button type="button" onClick={cargar} className={btnSuave}>Actualizar</button>
        </div>

        <div className="mb-5 flex flex-wrap gap-2">
          {PESTANAS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => { setPestana(t.id); setError(''); }}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                t.id === pestana
                  ? 'bg-primary text-white shadow'
                  : 'bg-white text-nube-oscuro ring-1 ring-primary/50 hover:bg-primary/15'
              }`}
            >
              {t.etiqueta} ({pedidos.filter(t.filtro).length})
            </button>
          ))}
        </div>

        {error && <p role="alert" className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
        {cargando && <p className="text-sm text-stone-600">Cargando…</p>}
        {!cargando && visibles.length === 0 && <p className="text-sm text-stone-600">No hay pedidos en esta sección.</p>}

        <div className="space-y-4">
          {visibles.map(p => (
            <TarjetaPedido
              key={p.id_venta}
              pedido={p}
              onCambio={() => { setError(''); cargar(); }}
              onError={setError}
            />
          ))}
        </div>
      </section>
    </div>
  );
};
