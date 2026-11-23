import React, { useEffect, useState } from 'react';
import { descargarReporteAPI, obtenerReporteAPI } from '../../services/apiService';
import type {
  DatosReporte, FormatoReporte, ReporteGananciasData, ReporteInventarioData, ReporteVentasData, TipoReporte,
} from '../../services/apiService';

interface ReportesAdminProps {
  onMostrarMensaje: (msg: string, esError: boolean) => void;
  onSetCargando: (cargando: boolean) => void;
}

const fechaLocal = (f: Date) =>
  `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`;

const moneda = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });
const claseTh = 'px-4 py-3';
const claseTd = 'px-4 py-3';

const REPORTES: { id: TipoReporte; titulo: string; texto: string }[] = [
  { id: 'ventas', titulo: 'Ventas', texto: 'Ventas, ingresos y ganancia por día o por mes, y por vendedor.' },
  { id: 'ganancias', titulo: 'Ganancias', texto: 'Unidades, ingresos, costo y ganancia de cada producto.' },
  { id: 'inventario', titulo: 'Inventario', texto: 'Stock actual, mínimos y valor a costo de los productos activos.' },
];

const claseCampo =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30';
const claseEtiqueta = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-600';

export const ReportesAdmin: React.FC<ReportesAdminProps> = ({ onMostrarMensaje, onSetCargando }) => {
  const hoy = new Date();
  const [tipo, setTipo] = useState<TipoReporte>('ventas');
  const [desde, setDesde] = useState(fechaLocal(new Date(hoy.getFullYear(), hoy.getMonth(), 1)));
  const [hasta, setHasta] = useState(fechaLocal(hoy));
  const [agrupar, setAgrupar] = useState<'dia' | 'mes'>('dia');
  const [informe, setInforme] = useState<{ tipo: TipoReporte; data: DatosReporte } | null>(null);

  useEffect(() => {
    setInforme(null);
  }, [tipo, desde, hasta, agrupar]);

  const necesitaFechas = tipo !== 'inventario';

  const verInforme = async () => {
    if (necesitaFechas && (!desde || !hasta || desde > hasta)) {
      onMostrarMensaje('Elige un rango de fechas válido: la fecha inicial no puede ser posterior a la final.', true);
      return;
    }
    onSetCargando(true);
    try {
      setInforme({ tipo, data: await obtenerReporteAPI(tipo, { desde, hasta, agrupar }) });
    } catch (err) {
      onMostrarMensaje(err instanceof Error ? err.message : 'No se pudo cargar el informe.', true);
    } finally {
      onSetCargando(false);
    }
  };

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
        <p className="text-sm text-stone-600">Mira el informe en pantalla y luego descárgalo en PDF o Excel.</p>
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

        <button
          type="button"
          onClick={verInforme}
          className="rounded-xl bg-nube-oscuro px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primaryFocus"
        >
          Ver informe
        </button>
      </div>

      {informe && (
        <div className="mt-6 space-y-4">
          {informe.tipo === 'ventas' && (() => {
            const d = informe.data as ReporteVentasData;
            const tabla = (titulo: string, filas: ReporteVentasData['filas'], primera: string) => (
              <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                <h4 className="px-4 pt-4 font-serif text-lg font-bold text-stone-900">{titulo}</h4>
                <table className="mt-2 w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase text-stone-600">
                    <tr>
                      <th className={claseTh}>{primera}</th><th className={claseTh}>Ventas</th>
                      <th className={claseTh}>Ingresos</th><th className={claseTh}>Costo</th><th className={claseTh}>Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {filas.map(f => (
                      <tr key={f.clave}>
                        <td className={claseTd}>{f.clave}</td><td className={claseTd}>{f.ventas}</td>
                        <td className={claseTd}>{moneda.format(f.ingresos)}</td><td className={claseTd}>{moneda.format(f.costo)}</td>
                        <td className={`${claseTd} font-semibold text-emerald-700`}>{moneda.format(f.ganancia)}</td>
                      </tr>
                    ))}
                    {filas.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-stone-600">No hay ventas confirmadas en este rango.</td></tr>}
                  </tbody>
                </table>
              </div>
            );
            return (
              <>
                {tabla(`Ventas por ${d.agrupar === 'mes' ? 'mes' : 'día'}`, d.filas, d.agrupar === 'mes' ? 'Mes' : 'Día')}
                {tabla('Ventas por vendedor', d.por_vendedor, 'Vendedor')}
                <p className="text-sm font-semibold text-nube-oscuro">
                  Total: {d.totales.ventas} ventas · Ingresos {moneda.format(d.totales.ingresos)} · Ganancia {moneda.format(d.totales.ganancia)}
                </p>
              </>
            );
          })()}

          {informe.tipo === 'ganancias' && (() => {
            const d = informe.data as ReporteGananciasData;
            return (
              <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase text-stone-600">
                    <tr>
                      <th className={claseTh}>Producto</th><th className={claseTh}>Unidades</th>
                      <th className={claseTh}>Ingresos</th><th className={claseTh}>Costo</th><th className={claseTh}>Ganancia</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {d.filas.map(f => (
                      <tr key={f.producto}>
                        <td className={claseTd}>{f.producto}</td><td className={claseTd}>{f.unidades}</td>
                        <td className={claseTd}>{moneda.format(f.ingresos)}</td><td className={claseTd}>{moneda.format(f.costo)}</td>
                        <td className={`${claseTd} font-semibold text-emerald-700`}>{moneda.format(f.ganancia)}</td>
                      </tr>
                    ))}
                    {d.filas.length === 0 && <tr><td colSpan={5} className="px-4 py-6 text-center text-stone-600">No hay ventas confirmadas en este rango.</td></tr>}
                  </tbody>
                  <tfoot className="bg-primary/10 text-sm font-semibold text-nube-oscuro">
                    <tr>
                      <td className={claseTd}>Total</td><td className={claseTd}>{d.totales.unidades}</td>
                      <td className={claseTd}>{moneda.format(d.totales.ingresos)}</td><td className={claseTd}>{moneda.format(d.totales.costo)}</td>
                      <td className={claseTd}>{moneda.format(d.totales.ganancia)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })()}

          {informe.tipo === 'inventario' && (() => {
            const d = informe.data as ReporteInventarioData;
            return (
              <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase text-stone-600">
                    <tr>
                      <th className={claseTh}>Producto</th><th className={claseTh}>Categoría</th><th className={claseTh}>Stock</th>
                      <th className={claseTh}>Mínimo</th><th className={claseTh}>Costo</th><th className={claseTh}>Valor a costo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100">
                    {d.filas.map(f => (
                      <tr key={f.producto} className={f.bajo_minimo ? 'bg-rose-50' : ''}>
                        <td className={claseTd}>{f.producto}</td><td className={claseTd}>{f.categoria}</td>
                        <td className={`${claseTd} ${f.bajo_minimo ? 'font-semibold text-rose-700' : ''}`}>{f.stock}</td>
                        <td className={claseTd}>{f.stock_minimo}</td><td className={claseTd}>{moneda.format(f.costo)}</td>
                        <td className={claseTd}>{moneda.format(f.valor_costo)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-primary/10 text-sm font-semibold text-nube-oscuro">
                    <tr>
                      <td className={claseTd}>{d.totales.productos} productos</td><td className={claseTd}></td>
                      <td className={claseTd}>{d.totales.unidades}</td><td className={claseTd}>{d.totales.bajo_minimo} bajo mínimo</td>
                      <td className={claseTd}></td><td className={claseTd}>{moneda.format(d.totales.valor_costo)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })()}

          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => descargar('pdf')} className="rounded-xl bg-nube-oscuro px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primaryFocus">
              Descargar PDF
            </button>
            <button type="button" onClick={() => descargar('excel')} className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-nube-oscuro ring-1 ring-primary transition hover:bg-primary/10">
              Descargar Excel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};
