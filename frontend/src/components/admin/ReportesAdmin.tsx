import React, { useState } from 'react';
import { descargarReporteAPI } from '../../services/apiService';
import type { FormatoReporte, TipoReporte } from '../../services/apiService';

interface ReportesAdminProps {
  onMostrarMensaje: (msg: string, esError: boolean) => void;
  onSetCargando: (cargando: boolean) => void;
}

const fechaLocal = (f: Date) =>
  `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

const REPORTES: { id: TipoReporte; titulo: string; texto: string }[] = [
  { id: 'ventas', titulo: 'Ventas', texto: 'Ventas, ingresos y ganancia por día o por mes, y por vendedor.' },
  { id: 'ganancias', titulo: 'Ganancias', texto: 'Unidades, ingresos, costo y ganancia de cada producto.' },
  { id: 'inventario', titulo: 'Inventario', texto: 'Stock actual, mínimos y valor a costo de los productos activos.' },
];

const claseCampo =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30';
const claseEtiqueta = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500';

export const ReportesAdmin: React.FC<ReportesAdminProps> = ({ onMostrarMensaje, onSetCargando }) => {
  const hoy = new Date();
  const [tipo, setTipo] = useState<TipoReporte>('ventas');
  const [desde, setDesde] = useState(fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const [hasta, setHasta] = useState(fechaLocal(hoy));
  const [agrupar, setAgrupar] = useState<'dia' | 'mes'>('dia');

  const necesitaFechas = tipo !== 'inventario';

  const descargar = async (formato: FormatoReporte) => {
    if (necesitaFechas && (!desde || !hasta || desde > hasta)) {
      onMostrarMensaje('Elige un rango de fechas válido: la fecha inicial no puede ser posterior a la final.', true);
      return;
    }
    onSetCargando(true);
    try {
      await descargarReporteAPI(tipo, formato, { desde, hasta, agrupar });
      onMostrarMensaje(`Reporte descargado en ${formato === 'pdf' ? 'PDF' : 'Excel'}.`, false);
    } catch (err) {
      onMostrarMensaje(err instanceof Error ? err.message : 'No se pudo descargar el reporte.', true);
    } finally {
      onSetCargando(false);
    }
  };

  return (
    <section>
      <div className="mb-6">
        <h3 className="font-serif text-2xl font-bold text-stone-900">Reportes</h3>
        <p className="text-sm text-stone-500">Descarga tus reportes en PDF o Excel.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Tipo de reporte">
        {REPORTES.map(r => (
          <button
            key={r.id}
            type="button"
            role="radio"
            aria-checked={tipo === r.id}
            onClick={() => setTipo(r.id)}
            className={`rounded-2xl border p-4 text-left transition ${
              tipo === r.id ? 'border-primary bg-primary/10 shadow-sm' : 'border-stone-200 bg-white hover:border-primary/60'
            }`}
          >
            <span className="block font-serif text-lg font-bold text-nube-oscuro">{r.titulo}</span>
            <span className="mt-1 block text-sm text-stone-600">{r.texto}</span>
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4 rounded-2xl border border-primary/30 bg-primary/10 p-5">
        {necesitaFechas ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="r-desde" className={claseEtiqueta}>Desde</label>
              <input id="r-desde" type="date" value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)} className={claseCampo} />
            </div>
            <div>
              <label htmlFor="r-hasta" className={claseEtiqueta}>Hasta</label>
              <input id="r-hasta" type="date" value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)} className={claseCampo} />
            </div>
            {tipo === 'ventas' && (
              <div>
                <label htmlFor="r-agrupar" className={claseEtiqueta}>Agrupar por</label>
                <select id="r-agrupar" value={agrupar} onChange={e => setAgrupar(e.target.value as 'dia' | 'mes')} className={claseCampo}>
                  <option value="dia">Día</option>
                  <option value="mes">Mes</option>
                </select>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-stone-700">El inventario muestra el stock de hoy, no necesita fechas.</p>
        )}

        {necesitaFechas && (
          <p className="text-xs text-stone-600">
            Solo cuentan las ventas con pago confirmado: las anuladas y las pendientes de pago no aparecen.
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => descargar('pdf')}
            className="rounded-xl bg-nube-oscuro px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primaryFocus"
          >
            Descargar PDF
          </button>
          <button
            type="button"
            onClick={() => descargar('excel')}
            className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-nube-oscuro ring-1 ring-primary transition hover:bg-primary/10"
          >
            Descargar Excel
          </button>
        </div>
      </div>
    </section>
  );
};
