import React, { useEffect, useMemo, useState } from 'react';
import type { Categoria, Producto } from '../interfaces';
import { obtenerCategoriasAPI, obtenerProductosAPI, obtenerVentasAPI } from '../services/apiService';
import type { VentaResumenAPI } from '../services/apiService';

type Periodo = 'hoy' | 'ultimos7' | 'esteMes' | 'mes' | 'anio' | 'rango';
type AgruparPor = 'dia' | 'mes';

interface PuntoGrafico {
  clave: string;
  etiqueta: string;
  ingresos: number;
}

interface ProductoVendido {
  producto: Producto;
  unidades: number;
  ingresos: number;
}

const moneda = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });
const formatoFecha = new Intl.DateTimeFormat('es-BO', { day: '2-digit', month: 'short' });
const formatoMes = new Intl.DateTimeFormat('es-BO', { month: 'short' });
const claseControl = 'rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';

const fechaLocal = (fecha: Date) => {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
};

const claveMes = (fecha: Date) => `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

const detallesDeVenta = (venta: VentaResumenAPI, categoriaId: string) =>
  categoriaId === 'todas'
    ? venta.detalles
    : venta.detalles.filter(detalle => detalle.Producto?.id_categoria === Number(categoriaId));

const ingresosDeVenta = (venta: VentaResumenAPI, categoriaId: string) => {
  if (categoriaId === 'todas') return Number(venta.total) || 0;
  return detallesDeVenta(venta, categoriaId).reduce((suma, detalle) => suma + Number(detalle.subtotal), 0);
};

export const Ventas: React.FC = () => {
  const [ahora] = useState(() => new Date());
  const hoy = fechaLocal(ahora);
  const [ventas, setVentas] = useState<VentaResumenAPI[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>('esteMes');
  const [mesSeleccionado, setMesSeleccionado] = useState(hoy.slice(0, 7));
  const [anioSeleccionado, setAnioSeleccionado] = useState(String(ahora.getFullYear()));
  const [desde, setDesde] = useState(hoy);
  const [hasta, setHasta] = useState(hoy);
  const [categoriaId, setCategoriaId] = useState('todas');
  const [ordenRanking, setOrdenRanking] = useState<'unidades' | 'ingresos'>('unidades');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarDatos = async () => {
    try {
      const [ventasCargadas, productosCargados, categoriasCargadas] = await Promise.all([
        obtenerVentasAPI(),
        obtenerProductosAPI(),
        obtenerCategoriasAPI(),
      ]);
      setVentas(ventasCargadas);
      setProductos(productosCargados);
      setCategorias(categoriasCargadas);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'No se pudieron cargar los datos de ventas.');
    } finally {
      setCargando(false);
    }
  };

  const actualizarDatos = () => {
    setCargando(true);
    setError('');
    void cargarDatos();
  };

  useEffect(() => {
    void cargarDatos();
  }, []);

  const periodoActual = useMemo(() => {
    let inicio = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
    let fin = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate(), 23, 59, 59, 999);

    if (periodo === 'ultimos7') inicio.setDate(inicio.getDate() - 6);
    if (periodo === 'esteMes') inicio = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    if (periodo === 'mes') {
      const [anio, mes] = mesSeleccionado.split('-').map(Number);
      inicio = new Date(anio, mes - 1, 1);
      fin = new Date(anio, mes, 0, 23, 59, 59, 999);
    }
    if (periodo === 'anio') {
      const anio = Number(anioSeleccionado);
      inicio = new Date(anio, 0, 1);
      fin = new Date(anio, 11, 31, 23, 59, 59, 999);
    }
    if (periodo === 'rango') {
      inicio = new Date(`${desde}T00:00:00`);
      fin = new Date(`${hasta}T23:59:59.999`);
    }
    return { inicio, fin };
  }, [ahora, periodo, mesSeleccionado, anioSeleccionado, desde, hasta]);

  const ventasFiltradas = useMemo(() => ventas.filter(venta => {
    if (venta.estado === 'anulada') return false;
    const fecha = new Date(venta.fecha);
    return fecha >= periodoActual.inicio && fecha <= periodoActual.fin &&
      (categoriaId === 'todas' || detallesDeVenta(venta, categoriaId).length > 0);
  }), [ventas, periodoActual, categoriaId]);

  const productosVendidos = useMemo(() => {
    const acumulado = new Map<number, ProductoVendido>();
    ventasFiltradas.forEach(venta => {
      detallesDeVenta(venta, categoriaId).forEach(detalle => {
        const producto = detalle.Producto;
        if (!producto) return;
        const actual = acumulado.get(producto.id_producto) ?? { producto, unidades: 0, ingresos: 0 };
        actual.unidades += Number(detalle.cantidad) || 0;
        actual.ingresos += Number(detalle.subtotal) || 0;
        acumulado.set(producto.id_producto, actual);
      });
    });
    return [...acumulado.values()];
  }, [ventasFiltradas, categoriaId]);

  const ingresos = ventasFiltradas.reduce((suma, venta) => suma + ingresosDeVenta(venta, categoriaId), 0);
  const unidades = ventasFiltradas.reduce((suma, venta) =>
    suma + detallesDeVenta(venta, categoriaId).reduce((subtotal, detalle) => subtotal + Number(detalle.cantidad), 0), 0);
  const ticketPromedio = ventasFiltradas.length ? ingresos / ventasFiltradas.length : 0;

  const agrupacion: AgruparPor = periodo === 'anio' || (periodo === 'rango' && periodoActual.fin.getTime() - periodoActual.inicio.getTime() > 31 * 24 * 60 * 60 * 1000)
    ? 'mes'
    : 'dia';

  const puntosGrafico = useMemo(() => {
    const puntos: PuntoGrafico[] = [];
    if (periodoActual.fin < periodoActual.inicio) return puntos;

    if (agrupacion === 'dia') {
      const cursor = new Date(periodoActual.inicio.getFullYear(), periodoActual.inicio.getMonth(), periodoActual.inicio.getDate());
      const ultimo = new Date(periodoActual.fin.getFullYear(), periodoActual.fin.getMonth(), periodoActual.fin.getDate());
      while (cursor <= ultimo && puntos.length < 366) {
        const clave = fechaLocal(cursor);
        puntos.push({ clave, etiqueta: formatoFecha.format(cursor), ingresos: 0 });
        cursor.setDate(cursor.getDate() + 1);
      }
    } else {
      const cursor = new Date(periodoActual.inicio.getFullYear(), periodoActual.inicio.getMonth(), 1);
      const ultimo = new Date(periodoActual.fin.getFullYear(), periodoActual.fin.getMonth(), 1);
      while (cursor <= ultimo && puntos.length < 60) {
        const clave = claveMes(cursor);
        puntos.push({ clave, etiqueta: formatoMes.format(cursor), ingresos: 0 });
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    const indice = new Map(puntos.map((punto, posicion) => [punto.clave, posicion]));
    ventasFiltradas.forEach(venta => {
      const fecha = new Date(venta.fecha);
      const clave = agrupacion === 'dia' ? fechaLocal(fecha) : claveMes(fecha);
      const posicion = indice.get(clave);
      if (posicion !== undefined) puntos[posicion].ingresos += ingresosDeVenta(venta, categoriaId);
    });
    return puntos;
  }, [ventasFiltradas, periodoActual, agrupacion, categoriaId]);

  const ranking = [...productosVendidos]
    .sort((a, b) => ordenRanking === 'unidades' ? b.unidades - a.unidades : b.ingresos - a.ingresos)
    .slice(0, 6);
  const productosSinVentas = productos
    .filter(producto => producto.activo !== false && (categoriaId === 'todas' || producto.id_categoria === Number(categoriaId)))
    .map(producto => ({ producto, venta: productosVendidos.find(item => item.producto.id_producto === producto.id_producto) }))
    .filter(item => !item.venta || item.venta.unidades <= 2)
    .sort((a, b) => (a.venta?.unidades ?? 0) - (b.venta?.unidades ?? 0))
    .slice(0, 8);

  const aniosDisponibles = useMemo(() => {
    const anioActual = ahora.getFullYear();
    const aniosEnVentas = ventas.map(venta => new Date(venta.fecha).getFullYear()).filter(Number.isFinite);
    const anioInicial = Math.min(anioActual - 4, ...aniosEnVentas);
    return Array.from({ length: anioActual - anioInicial + 1 }, (_, indice) => anioActual - indice);
  }, [ventas, ahora]);

  const maximoGrafica = Math.max(...puntosGrafico.map(punto => punto.ingresos), 1);
  const tarjetas = [
    { etiqueta: 'Ingresos', valor: moneda.format(ingresos), detalle: categoriaId === 'todas' ? 'Incluye el total registrado' : 'Ventas de la categoría seleccionada', color: 'text-emerald-700' },
    { etiqueta: 'Ventas', valor: String(ventasFiltradas.length), detalle: 'Transacciones no anuladas', color: 'text-sky-700' },
    { etiqueta: 'Unidades vendidas', valor: String(unidades), detalle: 'Unidades dentro del período', color: 'text-amber-700' },
    { etiqueta: 'Ticket promedio', valor: moneda.format(ticketPromedio), detalle: 'Ingresos divididos entre ventas', color: 'text-rose-700' },
  ];

  return (
    <section className="fade-in mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primaryFocus">Análisis comercial</p>
          <h1 className="mt-1 font-serif text-3xl font-bold text-stone-900">Panel de ventas</h1>
          <p className="mt-1 text-sm text-stone-500">Rendimiento, productos destacados y oportunidades de catálogo.</p>
        </div>
        <button type="button" onClick={actualizarDatos} disabled={cargando} className="rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 disabled:opacity-60">
          {cargando ? 'Actualizando…' : 'Actualizar datos'}
        </button>
      </header>

      {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p>}

      <section aria-label="Filtros de ventas" className="grid gap-3 rounded-xl border border-stone-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-xs font-semibold text-stone-600">
          Período
          <select className={claseControl} value={periodo} onChange={event => setPeriodo(event.target.value as Periodo)}>
            <option value="hoy">Hoy</option>
            <option value="ultimos7">Últimos 7 días</option>
            <option value="esteMes">Este mes</option>
            <option value="mes">Un mes específico</option>
            <option value="anio">Un año</option>
            <option value="rango">Rango de fechas</option>
          </select>
        </label>
        {periodo === 'mes' && (
          <label className="grid gap-1 text-xs font-semibold text-stone-600">
            Mes
            <input type="month" className={claseControl} value={mesSeleccionado} onChange={event => setMesSeleccionado(event.target.value)} />
          </label>
        )}
        {periodo === 'anio' && (
          <label className="grid gap-1 text-xs font-semibold text-stone-600">
            Año
            <select className={claseControl} value={anioSeleccionado} onChange={event => setAnioSeleccionado(event.target.value)}>
              {aniosDisponibles.map(anio => <option key={anio} value={anio}>{anio}</option>)}
            </select>
          </label>
        )}
        {periodo === 'rango' && (
          <>
            <label className="grid gap-1 text-xs font-semibold text-stone-600">Desde<input type="date" className={claseControl} value={desde} onChange={event => setDesde(event.target.value)} /></label>
            <label className="grid gap-1 text-xs font-semibold text-stone-600">Hasta<input type="date" className={claseControl} value={hasta} onChange={event => setHasta(event.target.value)} /></label>
          </>
        )}
        <label className="grid gap-1 text-xs font-semibold text-stone-600">
          Categoría
          <select className={claseControl} value={categoriaId} onChange={event => setCategoriaId(event.target.value)}>
            <option value="todas">Todas las categorías</option>
            {categorias.map(categoria => <option key={categoria.id_categoria} value={categoria.id_categoria}>{categoria.nombre}</option>)}
          </select>
        </label>
      </section>

      <section aria-label="Indicadores de ventas" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {tarjetas.map(tarjeta => (
          <article key={tarjeta.etiqueta} className="rounded-xl border border-stone-200 bg-white p-5">
            <p className="text-sm font-medium text-stone-500">{tarjeta.etiqueta}</p>
            <p className={`mt-3 font-serif text-2xl font-bold ${tarjeta.color}`}>{tarjeta.valor}</p>
            <p className="mt-2 text-xs text-stone-400">{tarjeta.detalle}</p>
          </article>
        ))}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-5">
        <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-bold text-stone-900">Ingresos por {agrupacion === 'dia' ? 'día' : 'mes'}</h2>
            <p className="text-sm text-stone-500">{puntosGrafico.length} períodos · {moneda.format(ingresos)} en total</p>
          </div>
          <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800">{agrupacion === 'dia' ? 'Vista diaria' : 'Vista mensual'}</span>
        </div>
        {cargando ? (
          <div className="flex h-56 items-center justify-center text-sm text-stone-400">Cargando ventas…</div>
        ) : puntosGrafico.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-sm text-stone-400">El rango seleccionado no es válido.</div>
        ) : (
          <div className="overflow-x-auto">
            <div className="flex h-56 min-w-full items-end gap-2 border-b border-stone-200 pb-2" style={{ minWidth: `${Math.max(puntosGrafico.length * 42, 100)}px` }}>
              {puntosGrafico.map(punto => (
                <div key={punto.clave} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2" title={`${punto.etiqueta}: ${moneda.format(punto.ingresos)}`}>
                  <span className="max-w-full truncate text-[10px] text-stone-500">{punto.ingresos > 0 ? moneda.format(punto.ingresos) : ''}</span>
                  <div className={`w-full max-w-10 rounded-t-md ${punto.ingresos > 0 ? 'bg-primary' : 'bg-stone-100'}`} style={{ height: `${punto.ingresos > 0 ? Math.max((punto.ingresos / maximoGrafica) * 100, 4) : 2}%` }} />
                  <span className="h-4 text-[10px] capitalize text-stone-500">{punto.etiqueta}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl border border-stone-200 bg-white p-5">
          <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-lg font-bold text-stone-900">Más vendidos</h2>
              <p className="text-sm text-stone-500">Productos con ventas en el período.</p>
            </div>
            <div className="inline-flex rounded-lg border border-stone-200 p-1" aria-label="Ordenar ranking">
              <button type="button" onClick={() => setOrdenRanking('unidades')} aria-pressed={ordenRanking === 'unidades'} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${ordenRanking === 'unidades' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Unidades</button>
              <button type="button" onClick={() => setOrdenRanking('ingresos')} aria-pressed={ordenRanking === 'ingresos'} className={`rounded-md px-3 py-1.5 text-xs font-semibold ${ordenRanking === 'ingresos' ? 'bg-stone-900 text-white' : 'text-stone-600 hover:bg-stone-100'}`}>Ingresos</button>
            </div>
          </header>
          {ranking.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">No hay ventas en este período.</p>
          ) : (
            <ol className="divide-y divide-stone-100">
              {ranking.map((item, indice) => (
                <li key={item.producto.id_producto} className="flex items-center gap-3 py-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-xs font-bold text-stone-600">{indice + 1}</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold text-stone-800">{item.producto.nombre}</span>
                  <span className="text-right text-xs text-stone-500">{item.unidades} ud.<br /><b className="text-stone-800">{moneda.format(item.ingresos)}</b></span>
                </li>
              ))}
            </ol>
          )}
        </article>

        <article className="rounded-xl border border-stone-200 bg-white p-5">
          <header className="mb-4">
            <h2 className="font-serif text-lg font-bold text-stone-900">Productos con poca o ninguna venta</h2>
            <p className="text-sm text-stone-500">Catálogo activo con dos unidades vendidas o menos.</p>
          </header>
          {productosSinVentas.length === 0 ? (
            <p className="py-8 text-center text-sm text-stone-400">Todos los productos activos superan ese umbral.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {productosSinVentas.map(({ producto, venta }) => (
                <li key={producto.id_producto} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0 truncate text-sm font-semibold text-stone-800">{producto.nombre}</span>
                  <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs font-semibold ${venta ? 'bg-amber-50 text-amber-800' : 'bg-rose-50 text-rose-700'}`}>
                    {venta ? `${venta.unidades} ${venta.unidades === 1 ? 'unidad' : 'unidades'}` : 'Sin ventas'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>
    </section>
  );
};