import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { Producto } from '../interfaces';
import {
  cancelarVentaAPI,
  buscarClientePorCarnetAPI,
  confirmarPagoAPI,
  guardarFacturaPDF,
  obtenerMisVentasAPI,
  obtenerProductosAPI,
  registrarVentaVendedorAPI,
} from '../services/apiService';
import type { VentaVendedorAPI } from '../services/apiService';
import { carnetValido, celularValido, filtroCarnet, nombreValido, soloDigitos, soloLetras } from '../utils/validaciones';
import { CuentaAtrasCancelar } from '../components/CuentaAtrasCancelar';
import { ConfirmacionDialog } from '../components/ConfirmacionDialog';

interface LineaVenta {
  producto: Producto;
  cantidad: number;
}

const METODOS = [
  { valor: 'efectivo', etiqueta: 'Efectivo' },
  { valor: 'qr', etiqueta: 'QR' },
  { valor: 'transferencia', etiqueta: 'Transferencia' },
];

const ESTADOS: Record<string, string> = {
  pendiente: 'bg-amber-100 text-amber-800',
  pagado: 'bg-emerald-100 text-emerald-800',
  enviado: 'bg-sky-100 text-sky-800',
  entregado: 'bg-stone-200 text-stone-700',
};

const moneda = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });
const claseControl =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20';
const claseBoton =
  'rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primaryFocus disabled:cursor-not-allowed disabled:opacity-50';
const claseTarjeta = 'rounded-2xl border border-stone-200 bg-white p-5 shadow-sm';
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ErrorCampo: React.FC<{ texto?: string }> = ({ texto }) =>
  texto ? <p role="alert" className="mt-1 text-xs text-rose-600">{texto}</p> : null;

export const Vender: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [lineas, setLineas] = useState<LineaVenta[]>([]);

  // Datos del cliente
  const [carnet, setCarnet] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [direccion, setDireccion] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState(false);
  const [datosConfirmados, setDatosConfirmados] = useState(false);
  const [mensajeCarnet, setMensajeCarnet] = useState('');
  const [buscandoCarnet, setBuscandoCarnet] = useState(false);

  // Pago
  const [pagoAhora, setPagoAhora] = useState(true);
  const [metodo, setMetodo] = useState('efectivo');

  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [exito, setExito] = useState('');

  // Mis ventas
  const [misVentas, setMisVentas] = useState<VentaVendedorAPI[]>([]);
  const [metodoPorVenta, setMetodoPorVenta] = useState<Record<number, string>>({});
  const [confirmando, setConfirmando] = useState<number | null>(null);
  const [cancelando, setCancelando] = useState<number | null>(null);
  const [ventaAAnular, setVentaAAnular] = useState<number | null>(null);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroEstadoPedido, setFiltroEstadoPedido] = useState('todos');
  const [filtroTipoPedido, setFiltroTipoPedido] = useState('todos');

  const [descargando, setDescargando] = useState<number | null>(null);

  const cargarProductos = useCallback(async () => {
    try {
      setProductos(await obtenerProductosAPI());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar los productos.');
    }
  }, []);

  const cargarMisVentas = useCallback(async () => {
    try {
      setMisVentas(await obtenerMisVentasAPI());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar tus ventas.');
    }
  }, []);

  useEffect(() => {
    cargarProductos();
    cargarMisVentas();
  }, [cargarProductos, cargarMisVentas]);

  const productosFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter(p => !texto || p.nombre.toLowerCase().includes(texto));
  }, [productos, busqueda]);

  const ventasFiltradas = useMemo(() => {
    const inicio = fechaDesde ? new Date(`${fechaDesde}T00:00:00`).getTime() : null;
    const fin = fechaHasta ? new Date(`${fechaHasta}T23:59:59.999`).getTime() : null;

    return misVentas.filter(venta => {
      const fecha = new Date(venta.fecha).getTime();
      if (inicio !== null && fecha < inicio) return false;
      if (fin !== null && fecha > fin) return false;

      const coincideEstado =
        filtroEstadoPedido === 'todos' ||
        (filtroEstadoPedido === 'anulada'
          ? venta.estado === 'anulada'
          : venta.estado !== 'anulada' && venta.estado_pedido === filtroEstadoPedido);
      const esPedidoEnLinea = venta.id_usuario != null;
      const coincideTipo =
        filtroTipoPedido === 'todos' ||
        (filtroTipoPedido === 'en-linea' ? esPedidoEnLinea : !esPedidoEnLinea);

      return coincideEstado && coincideTipo;
    });
  }, [misVentas, fechaDesde, fechaHasta, filtroEstadoPedido, filtroTipoPedido]);

  // --- Cliente ---
  const cambiarCarnet = (valor: string) => {
    setCarnet(valor);
    setClienteEncontrado(false);
    setDatosConfirmados(false);
    setMensajeCarnet('');
    setErrores({});
  };

  const editarDato = (setter: (valor: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    setErrores({});
    setDatosConfirmados(false); // si el vendedor corrige algo, debe volver a confirmar
  };

  const buscarCarnet = async () => {
    if (!carnet.trim()) return;
    if (!carnetValido(carnet)) {
      setClienteEncontrado(false);
      setMensajeCarnet('El carnet solo puede tener letras, números y un guion (5 a 20 caracteres).');
      return;
    }
    setBuscandoCarnet(true);
    setError('');
    try {
      const cliente = await buscarClientePorCarnetAPI(carnet);
      if (cliente) {
        setNombre(cliente.nombre || '');
        setTelefono((cliente.telefono || '').replace(/\D/g, '').slice(-8));
        setCorreo(cliente.correo || '');
        setDireccion(cliente.direccion || '');
        setClienteEncontrado(true);
        setDatosConfirmados(false);
        setMensajeCarnet('Cliente encontrado. Revisa los datos, corrígelos si cambiaron y confírmalos.');
      } else {
        setClienteEncontrado(false);
        setMensajeCarnet('No hay un cliente con ese carnet. Llena los datos para registrarlo.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo buscar el cliente.');
    } finally {
      setBuscandoCarnet(false);
    }
  };

  // --- Productos ---
  const agregar = (producto: Producto) => {
    const stock = Number(producto.stock);
    if (stock <= 0) return;
    setLineas(prev => {
      const existente = prev.find(l => l.producto.id_producto === producto.id_producto);
      if (!existente) return [...prev, { producto, cantidad: 1 }];
      return prev.map(l =>
        l.producto.id_producto === producto.id_producto ? { ...l, cantidad: Math.min(l.cantidad + 1, stock) } : l,
      );
    });
  };

  const cambiarCantidad = (id: number, delta: number) => {
    setLineas(prev =>
      prev.flatMap(l => {
        if (l.producto.id_producto !== id) return [l];
        const nueva = Math.min(l.cantidad + delta, Number(l.producto.stock));
        return nueva <= 0 ? [] : [{ ...l, cantidad: nueva }];
      }),
    );
  };

  const subtotal = lineas.reduce((suma, l) => suma + Number(l.producto.precio) * l.cantidad, 0);
  const total = subtotal;

  const limpiarFormulario = () => {
    setLineas([]);
    setBusqueda('');
    setCarnet('');
    setNombre('');
    setTelefono('');
    setCorreo('');
    setDireccion('');
    setClienteEncontrado(false);
    setDatosConfirmados(false);
    setMensajeCarnet('');
    setErrores({});
  };

  // --- Registrar venta (y cobrarla si se marcó) ---
  const registrarVenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setExito('');

    const nuevos: Record<string, string> = {};
    if (lineas.length === 0) nuevos.productos = 'Agrega al menos un producto.';
    if (carnet.trim() && !carnetValido(carnet.trim())) nuevos.carnet = 'El carnet solo puede tener letras, números y un guion (5 a 20 caracteres).';
    if (!nombreValido(nombre)) nuevos.nombre = 'Escribe el nombre del cliente usando solo letras.';
    if (telefono.trim() && !celularValido(telefono)) nuevos.telefono = 'El teléfono debe tener 8 números.';
    if (correo.trim() && !REGEX_CORREO.test(correo.trim())) nuevos.correo = 'Ingresa un correo válido.';
    if (clienteEncontrado && !datosConfirmados) nuevos.confirmacion = 'Confirma que los datos del cliente son correctos.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    setEnviando(true);
    try {
      const venta = await registrarVentaVendedorAPI({
        cliente: {
          carnet: carnet.trim() || undefined,
          nombre: nombre.trim(),
          telefono: telefono.trim() || undefined,
          correo: correo.trim() || undefined,
          direccion: direccion.trim() || undefined,
        },
        items: lineas.map(l => ({ id_producto: l.producto.id_producto, cantidad: l.cantidad })),
      });

      let aviso = `Venta #${venta.id_venta} registrada por ${moneda.format(Number(venta.total))}.`;
      if (pagoAhora) {
        try {
          await confirmarPagoAPI(venta.id_venta, metodo);
          aviso += ' Pago confirmado.';
        } catch (errorPago) {
          const motivo = errorPago instanceof Error ? errorPago.message : 'error desconocido';
          setError(`La venta #${venta.id_venta} se registró, pero no se pudo confirmar el pago: ${motivo}`);
        }
      }
      setExito(aviso);
      limpiarFormulario();
      await Promise.all([cargarProductos(), cargarMisVentas()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo registrar la venta.');
    } finally {
      setEnviando(false);
    }
  };

  const cobrar = async (idVenta: number) => {
    setConfirmando(idVenta);
    setError('');
    setExito('');
    try {
      await confirmarPagoAPI(idVenta, metodoPorVenta[idVenta] || 'efectivo');
      setExito(`Pago de la venta #${idVenta} confirmado.`);
      await cargarMisVentas();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo confirmar el pago.');
    } finally {
      setConfirmando(null);
    }
  };

  const solicitarAnulacion = (idVenta: number) => setVentaAAnular(idVenta);

  const confirmarAnulacion = async () => {
    if (ventaAAnular === null) return;
    const idVenta = ventaAAnular;
    setVentaAAnular(null);
    setCancelando(idVenta);
    setError('');
    setExito('');
    try {
      await cancelarVentaAPI(idVenta);
      setVentaAAnular(null);
      setExito(`Venta #${idVenta} anulada y stock devuelto.`);
      await Promise.all([cargarProductos(), cargarMisVentas()]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cancelar la venta.');
    } finally {
      setCancelando(null);
    }
  };

  const descargarTicket = async (idVenta: number) => {
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

  const resumen = useMemo(() => {
    const validas = misVentas.filter(v => v.estado !== 'anulada');
    const vendido = validas.reduce((suma, v) => suma + Number(v.total), 0);
    const cobrado = validas.reduce(
      (suma, v) => suma + (v.pagos || []).reduce((s, p) => s + Number(p.monto), 0),
      0,
    );
    return { cantidad: validas.length, vendido, cobrado, porCobrar: vendido - cobrado };
  }, [misVentas]);
  const ventaSeleccionadaParaAnular = misVentas.find(v => v.id_venta === ventaAAnular);

  return (
    <div className="fade-in mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h2 className="font-serif text-3xl font-bold text-stone-900">Registrar venta</h2>
      <p className="mb-6 text-sm text-stone-600">
        Registra la venta de tienda, confirma el cobro y revisa lo que vendiste.
      </p>

      {error && (
        <div role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      )}
      {exito && (
        <div role="status" className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {exito}
        </div>
      )}

      <form onSubmit={registrarVenta} noValidate autoComplete="off" className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          {/* CLIENTE */}
          <section className={claseTarjeta}>
            <h3 className="mb-3 font-semibold text-stone-900">Cliente</h3>
            <label className="mb-1 block text-xs font-semibold text-stone-600" htmlFor="carnet">
              Carnet (opcional)
            </label>
            <div className="flex gap-2">
              <input
                id="carnet"
                autoComplete="off"
                maxLength={20}
                className={claseControl}
                value={carnet}
                onChange={e => cambiarCarnet(filtroCarnet(e.target.value))}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    buscarCarnet();
                  }
                }}
                placeholder="Solo si el cliente quiere darlo"
              />
              <button type="button" className={claseBoton} onClick={buscarCarnet} disabled={buscandoCarnet || !carnet.trim()}>
                {buscandoCarnet ? 'Buscando…' : 'Buscar'}
              </button>
            </div>
            <ErrorCampo texto={errores.carnet} />
            {mensajeCarnet && (
              <p className={`mt-2 text-xs ${clienteEncontrado ? 'text-emerald-700' : 'text-stone-600'}`}>{mensajeCarnet}</p>
            )}

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600" htmlFor="nombre">Nombre *</label>
                <input id="nombre" autoComplete="off" maxLength={150} className={claseControl} value={nombre} onChange={editarDato(v => setNombre(soloLetras(v)))} />
                <ErrorCampo texto={errores.nombre} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600" htmlFor="telefono">Teléfono</label>
                <input id="telefono" type="tel" inputMode="numeric" maxLength={8} autoComplete="off" className={claseControl} value={telefono} onChange={editarDato(v => setTelefono(soloDigitos(v, 8)))} />
                <ErrorCampo texto={errores.telefono} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600" htmlFor="correo">Correo</label>
                <input id="correo" type="email" autoComplete="off" className={claseControl} value={correo} onChange={editarDato(setCorreo)} />
                <ErrorCampo texto={errores.correo} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-stone-600" htmlFor="direccion">Dirección habitual</label>
                <input id="direccion" autoComplete="off" className={claseControl} value={direccion} onChange={editarDato(setDireccion)} />
              </div>
            </div>

            {clienteEncontrado && (
              <label className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                <input type="checkbox" checked={datosConfirmados} onChange={e => setDatosConfirmados(e.target.checked)} />
                Confirmo que los datos del cliente son correctos
              </label>
            )}
            <ErrorCampo texto={datosConfirmados ? undefined : errores.confirmacion} />
          </section>

          {/* PRODUCTOS */}
          <section className={claseTarjeta}>
            <h3 className="mb-3 font-semibold text-stone-900">Productos</h3>
            <input
              className={`${claseControl} mb-3`}
              autoComplete="off"
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar producto…"
            />
            <ul className="max-h-72 divide-y divide-stone-100 overflow-y-auto">
              {productosFiltrados.map(p => (
                <li key={p.id_producto} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-stone-800">{p.nombre}</p>
                    <p className="text-xs text-stone-600">
                      {moneda.format(Number(p.precio))} · Stock: {Number(p.stock)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg border border-primary px-3 py-1 text-sm font-semibold text-nube-oscuro hover:bg-primary hover:text-nube-oscuro disabled:cursor-not-allowed disabled:opacity-40"
                    onClick={() => agregar(p)}
                    disabled={Number(p.stock) <= 0}
                  >
                    Agregar
                  </button>
                </li>
              ))}
              {productosFiltrados.length === 0 && <li className="py-3 text-sm text-stone-600">No hay productos.</li>}
            </ul>
            <ErrorCampo texto={lineas.length === 0 ? errores.productos : undefined} />
          </section>
        </div>

        {/* RESUMEN */}
        <aside className={`${claseTarjeta} h-fit lg:sticky lg:top-24`}>
          <h3 className="mb-3 font-semibold text-stone-900">Resumen de la venta</h3>
          {lineas.length === 0 ? (
            <p className="text-sm text-stone-600">Aún no agregaste productos.</p>
          ) : (
            <ul className="mb-4 divide-y divide-stone-100">
              {lineas.map(l => (
                <li key={l.producto.id_producto} className="flex items-center justify-between gap-2 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate text-stone-800">{l.producto.nombre}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" aria-label="Quitar uno" className="h-7 w-7 rounded border border-stone-300" onClick={() => cambiarCantidad(l.producto.id_producto, -1)}>−</button>
                    <span className="w-6 text-center">{l.cantidad}</span>
                    <button type="button" aria-label="Agregar uno" className="h-7 w-7 rounded border border-stone-300 disabled:opacity-40" onClick={() => cambiarCantidad(l.producto.id_producto, 1)} disabled={l.cantidad >= Number(l.producto.stock)}>+</button>
                  </div>
                  <span className="w-20 text-right text-stone-700">{moneda.format(Number(l.producto.precio) * l.cantidad)}</span>
                </li>
              ))}
            </ul>
          )}

          <div className="mb-4 space-y-1 border-t border-stone-100 pt-3 text-sm">
            <div className="flex justify-between text-stone-600"><span>Subtotal</span><span>{moneda.format(subtotal)}</span></div>
            <div className="flex justify-between text-base font-bold text-stone-900"><span>Total</span><span>{moneda.format(total)}</span></div>
          </div>

          <label className="mb-2 flex items-center gap-2 text-sm text-stone-700">
            <input type="checkbox" checked={pagoAhora} onChange={e => setPagoAhora(e.target.checked)} />
            El cliente ya pagó
          </label>
          {pagoAhora && (
            <select className={`${claseControl} mb-3`} value={metodo} onChange={e => setMetodo(e.target.value)} aria-label="Método de pago">
              {METODOS.map(m => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
            </select>
          )}

          <button type="submit" className={`${claseBoton} w-full`} disabled={enviando}>
            {enviando ? 'Registrando…' : pagoAhora ? 'Registrar venta y cobro' : 'Registrar venta (pago pendiente)'}
          </button>
        </aside>
      </form>

      {/* MIS VENTAS */}
      <section className="mt-10">
        <h3 className="mb-3 font-serif text-2xl font-bold text-stone-900">Mis ventas</h3>
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Ventas registradas', String(resumen.cantidad)],
            ['Total vendido', moneda.format(resumen.vendido)],
            ['Cobrado', moneda.format(resumen.cobrado)],
            ['Por cobrar', moneda.format(resumen.porCobrar)],
          ].map(([titulo, valor]) => (
            <div key={titulo} className={claseTarjeta}>
              <p className="text-xs font-semibold uppercase text-stone-600">{titulo}</p>
              <p className="mt-1 text-xl font-bold text-stone-900">{valor}</p>
            </div>
          ))}
        </div>

        <div className="mb-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-xs font-semibold text-stone-600">
              Desde
              <input
                type="date"
                value={fechaDesde}
                max={fechaHasta || undefined}
                onChange={e => setFechaDesde(e.target.value)}
                className={claseControl}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-stone-600">
              Hasta
              <input
                type="date"
                value={fechaHasta}
                min={fechaDesde || undefined}
                onChange={e => setFechaHasta(e.target.value)}
                className={claseControl}
              />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-stone-600">
              Estado del pedido
              <select
                value={filtroEstadoPedido}
                onChange={e => setFiltroEstadoPedido(e.target.value)}
                className={claseControl}
              >
                <option value="todos">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="pagado">Pagado</option>
                <option value="enviado">Enviado</option>
                <option value="entregado">Entregado</option>
                <option value="anulada">Anulado</option>
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-stone-600">
              Tipo de pedido
              <select
                value={filtroTipoPedido}
                onChange={e => setFiltroTipoPedido(e.target.value)}
                className={claseControl}
              >
                <option value="todos">Todos los tipos</option>
                <option value="tienda">Venta de tienda</option>
                <option value="en-linea">Pedido en línea</option>
              </select>
            </label>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-stone-600">Mostrando {ventasFiltradas.length} de {misVentas.length} ventas</p>
            <button
              type="button"
              onClick={() => {
                setFechaDesde('');
                setFechaHasta('');
                setFiltroEstadoPedido('todos');
                setFiltroTipoPedido('todos');
              }}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-nube-oscuro transition hover:bg-primary/10"
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-stone-50 text-xs uppercase text-stone-600">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Pedido</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Acciones</th>
                <th className="px-4 py-3">Ticket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {ventasFiltradas.map(v => {
                const pago = v.pagos && v.pagos[0];
                const puedeCobrar = v.estado === 'registrada' && v.estado_pedido === 'pendiente';
                const puedeCancelar =
                  v.estado === 'registrada' &&
                  (v.estado_pedido === 'pendiente' || v.estado_pedido === 'pagado');
                return (
                  <tr key={v.id_venta}>
                    <td className="px-4 py-3 font-medium">{v.id_venta}</td>
                    <td className="px-4 py-3 text-stone-600">{new Date(v.fecha).toLocaleString('es-BO')}</td>
                    <td className="px-4 py-3">{v.Cliente?.nombre || '—'}</td>
                    <td className="px-4 py-3">{moneda.format(Number(v.total))}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${v.estado === 'anulada' ? 'bg-rose-100 text-rose-800' : ESTADOS[v.estado_pedido]}`}>
                        {v.estado === 'anulada' ? 'anulada' : v.estado_pedido}
                      </span>
                    </td>
                    <td className="px-4 py-3">{v.id_usuario != null ? 'Pedido en línea' : 'Venta de tienda'}</td>
                    <td className="px-4 py-3">
                      {pago ? (
                        <span className="text-stone-700">{pago.metodo} · {moneda.format(Number(pago.monto))}</span>
                      ) : puedeCobrar ? (
                        <div className="flex items-center gap-2">
                          <select
                            className="rounded-lg border border-stone-300 px-2 py-1 text-xs"
                            value={metodoPorVenta[v.id_venta] || 'efectivo'}
                            onChange={e => setMetodoPorVenta(prev => ({ ...prev, [v.id_venta]: e.target.value }))}
                            aria-label={`Método de pago de la venta ${v.id_venta}`}
                          >
                            {METODOS.map(m => <option key={m.valor} value={m.valor}>{m.etiqueta}</option>)}
                          </select>
                          <button type="button" className={`${claseBoton} px-3 py-1 text-xs`} onClick={() => cobrar(v.id_venta)} disabled={confirmando === v.id_venta}>
                            {confirmando === v.id_venta ? '…' : 'Confirmar pago'}
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {puedeCancelar ? (
                        <CuentaAtrasCancelar
                          creadaEn={v.createdAt || v.fecha}
                          texto="Anular venta"
                          cancelando={cancelando === v.id_venta}
                          onCancelar={() => solicitarAnulacion(v.id_venta)}
                        />
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      {v.estado === 'registrada' && v.estado_pedido !== 'pendiente' ? (
                        <button
                          type="button"
                          onClick={() => descargarTicket(v.id_venta)}
                          disabled={descargando === v.id_venta}
                          className={`${claseBoton} px-3 py-1 text-xs`}
                        >
                          Ticket
                        </button>
                      ) : '—'}
                    </td>
                  </tr>
                );
              })}
              {ventasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-6 text-center text-stone-600">
                    {misVentas.length === 0 ? 'Todavía no registraste ventas.' : 'No hay ventas que coincidan con los filtros.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {ventaAAnular !== null && (
        <ConfirmacionDialog
          titulo={`¿Anular la venta #${ventaAAnular}?`}
          mensaje="Los productos de esta venta se devolverán al inventario."
          aviso={ventaSeleccionadaParaAnular?.estado_pedido === 'pagado' ? 'El pago quedará en el historial; recuerda gestionar manualmente el reembolso.' : undefined}
          textoConfirmar="Sí, anular venta"
          onConfirmar={confirmarAnulacion}
          onCancelar={() => setVentaAAnular(null)}
        />
      )}
    </div>
  );
};