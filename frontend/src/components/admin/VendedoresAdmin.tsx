import React, { useEffect, useState } from 'react';
import { CampoContrasena } from '../auth/CampoContrasena';
import {
  cambiarActivoVendedorAPI,
  crearVendedorAPI,
  obtenerVendedoresAPI,
  obtenerVentasDeVendedorAPI,
} from '../../services/apiService';
import type { VendedorAPI, VentaVendedorAPI } from '../../services/apiService';

interface VendedoresAdminProps {
  onMostrarMensaje: (msg: string, esError: boolean) => void;
  onSetCargando: (cargando: boolean) => void;
}

const moneda = new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB' });
const claseCampo =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30';
const claseEtiqueta = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500';
const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ErrorCampo: React.FC<{ texto?: string }> = ({ texto }) =>
  texto ? <p role="alert" className="mt-1 text-xs text-rose-600">{texto}</p> : null;

const NOMBRES_ESTADO: Record<string, string> = { pagado: 'Pagado', enviado: 'Enviado', entregado: 'Entregado' };

const etiquetaVenta = (v: VentaVendedorAPI) => {
  if (v.estado === 'anulada') return { texto: 'Anulada (no cuenta)', clase: 'bg-rose-50 text-rose-700' };
  if (v.estado_pedido === 'pendiente') return { texto: 'Pendiente de pago', clase: 'bg-amber-50 text-amber-800' };
  return { texto: NOMBRES_ESTADO[v.estado_pedido] ?? 'Pagado', clase: 'bg-emerald-50 text-emerald-800' };
};

export const VendedoresAdmin: React.FC<VendedoresAdminProps> = ({ onMostrarMensaje, onSetCargando }) => {
  const [vendedores, setVendedores] = useState<VendedorAPI[]>([]);
  const [cargado, setCargado] = useState(false);
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [viendo, setViendo] = useState<VendedorAPI | null>(null);
  const [ventas, setVentas] = useState<VentaVendedorAPI[]>([]);
  const [cargandoVentas, setCargandoVentas] = useState(false);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});

  const cargar = async () => {
    onSetCargando(true);
    try {
      setVendedores(await obtenerVendedoresAPI());
    } catch (err) {
      onMostrarMensaje(err instanceof Error ? err.message : 'No se pudieron cargar los vendedores.', true);
    } finally {
      setCargado(true);
      onSetCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const crear = async (e: React.FormEvent) => {
    e.preventDefault();
    const nuevos: Record<string, string> = {};
    if (!nombre.trim()) nuevos.nombre = 'Escribe el nombre del vendedor.';
    if (!REGEX_CORREO.test(correo.trim())) nuevos.correo = 'Ingresa un correo válido.';
    if (contrasena.length < 8 || !/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
      nuevos.contrasena = 'Mínimo 8 caracteres, con letras y números.';
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    onSetCargando(true);
    try {
      const res = await crearVendedorAPI({ nombre, correo, contrasena });
      if (res.success) {
        onMostrarMensaje('Vendedor creado.', false);
        setNombre('');
        setCorreo('');
        setContrasena('');
        setCreando(false);
        setErrores({});
        await cargar();
      } else {
        onMostrarMensaje(res.error || res.mensaje || 'No se pudo crear el vendedor.', true);
      }
    } catch {
      onMostrarMensaje('Error de red al crear el vendedor.', true);
    } finally {
      onSetCargando(false);
    }
  };

  const alternarActivo = async (v: VendedorAPI) => {
    onSetCargando(true);
    try {
      const res = await cambiarActivoVendedorAPI(v.id_usuario, !v.activo);
      if (res.success) {
        onMostrarMensaje(v.activo ? 'Vendedor desactivado: ya no puede entrar.' : 'Vendedor activado.', false);
        await cargar();
      } else {
        onMostrarMensaje(res.error || res.mensaje || 'No se pudo actualizar el vendedor.', true);
      }
    } catch {
      onMostrarMensaje('Error de red al actualizar el vendedor.', true);
    } finally {
      onSetCargando(false);
    }
  };

  const verVentas = async (v: VendedorAPI) => {
    setViendo(v);
    setVentas([]);
    setDesde('');
    setHasta('');
    setCargandoVentas(true);
    try {
      setVentas(await obtenerVentasDeVendedorAPI(v.id_usuario));
    } catch (err) {
      onMostrarMensaje(err instanceof Error ? err.message : 'No se pudieron cargar las ventas.', true);
      setViendo(null);
    } finally {
      setCargandoVentas(false);
    }
  };

  const ventasVisibles = ventas.filter(v => {
    const fecha = new Date(v.fecha);
    if (desde && fecha < new Date(`${desde}T00:00:00`)) return false;
    if (hasta && fecha > new Date(`${hasta}T23:59:59.999`)) return false;
    return true;
  });
  const confirmadas = ventasVisibles.filter(v => v.estado !== 'anulada' && v.estado_pedido !== 'pendiente');
  const totalConfirmado = confirmadas.reduce((suma, v) => suma + Number(v.total), 0);

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">Vendedores</h3>
          <p className="text-sm text-stone-500">Crea vendedores, actívalos o desactívalos y revisa las ventas de cada uno.</p>
        </div>
        <button
          type="button"
          onClick={() => { setCreando(v => !v); setErrores({}); }}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primaryFocus"
        >
          {creando ? 'Cancelar' : '+ Nuevo vendedor'}
        </button>
      </div>

      {creando && (
        <form onSubmit={crear} noValidate autoComplete="off" className="mb-6 space-y-4 rounded-2xl border border-primary/30 bg-primary/10 p-5">
          <div>
            <label htmlFor="v-nombre" className={claseEtiqueta}>Nombre completo</label>
            <input id="v-nombre" required maxLength={150} autoComplete="off" value={nombre} onChange={e => setNombre(e.target.value)} className={claseCampo} />
            <ErrorCampo texto={errores.nombre} />
          </div>
          <div>
            <label htmlFor="v-correo" className={claseEtiqueta}>Correo</label>
            <input id="v-correo" type="email" required maxLength={150} autoComplete="off" value={correo} onChange={e => setCorreo(e.target.value)} className={claseCampo} />
            <ErrorCampo texto={errores.correo} />
          </div>
          <CampoContrasena
            id="v-clave"
            etiqueta="Contraseña"
            valor={contrasena}
            onCambio={setContrasena}
            autoComplete="new-password"
            ayuda="Mínimo 8 caracteres, con al menos una letra y un número."
            error={errores.contrasena}
          />
          <button type="submit" className="rounded-xl bg-nube-oscuro px-5 py-2.5 text-sm font-semibold text-white hover:bg-primaryFocus">
            Crear vendedor
          </button>
        </form>
      )}

      {cargado && vendedores.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-stone-300 bg-nube-crema px-6 py-10 text-center text-sm text-stone-500">
          Todavía no hay vendedores.
        </p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendedores.map(v => (
            <li key={v.id_usuario} className="flex flex-col rounded-2xl border border-primary/30 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h4 className="truncate font-serif text-lg font-bold text-stone-900" title={v.nombre}>{v.nombre}</h4>
                  <p className="truncate text-sm text-stone-500" title={v.correo}>{v.correo}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.activo ? 'bg-emerald-50 text-emerald-800' : 'bg-stone-100 text-stone-500'}`}>
                  {v.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>

              <p className="mt-3 flex-1 text-sm text-stone-700">
                {v.ventas_pagadas} {v.ventas_pagadas === 1 ? 'venta' : 'ventas'} con pago confirmado ·{' '}
                <span className="font-semibold text-nube-oscuro">{moneda.format(v.total_vendido)}</span>
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                <button type="button" onClick={() => verVentas(v)} className="rounded-lg px-3 py-1.5 text-sm font-semibold text-nube-oscuro transition hover:bg-primary/10">
                  Ver ventas
                </button>
                <button
                  type="button"
                  onClick={() => alternarActivo(v)}
                  className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${v.activo ? 'text-rose-600 hover:bg-rose-50' : 'text-nube-oscuro hover:bg-primary/10'}`}
                >
                  {v.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {viendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setViendo(null)}>
          <div
            role="dialog"
            aria-modal="true"
            onClick={e => e.stopPropagation()}
            className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between bg-primary px-6 py-4 text-white">
              <h4 className="font-serif text-lg font-bold">Ventas de {viendo.nombre}</h4>
              <button type="button" onClick={() => setViendo(null)} aria-label="Cerrar" className="text-2xl leading-none">×</button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto px-6 py-5">
              <div className="mb-3 flex flex-wrap items-end gap-3">
                <div>
                  <label htmlFor="f-desde" className={claseEtiqueta}>Desde</label>
                  <input id="f-desde" type="date" value={desde} max={hasta || undefined} onChange={e => setDesde(e.target.value)} className={claseCampo} />
                </div>
                <div>
                  <label htmlFor="f-hasta" className={claseEtiqueta}>Hasta</label>
                  <input id="f-hasta" type="date" value={hasta} min={desde || undefined} onChange={e => setHasta(e.target.value)} className={claseCampo} />
                </div>
                {(desde || hasta) && (
                  <button type="button" onClick={() => { setDesde(''); setHasta(''); }} className="rounded-lg px-3 py-2 text-sm font-semibold text-nube-oscuro hover:bg-primary/10">
                    Limpiar
                  </button>
                )}
              </div>
              {cargandoVentas && <p className="text-sm text-stone-500">Cargando…</p>}
              {!cargandoVentas && ventas.length === 0 && <p className="text-sm text-stone-500">Este vendedor aún no tiene ventas.</p>}
              {!cargandoVentas && ventas.length > 0 && ventasVisibles.length === 0 && (
                <p className="text-sm text-stone-500">No hay ventas en ese rango de fechas.</p>
              )}
              {ventasVisibles.map(v => {
                const etiqueta = etiquetaVenta(v);
                return (
                  <div key={v.id_venta} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-stone-200 px-4 py-3 text-sm">
                    <div>
                      <p className="font-semibold text-stone-800">Venta #{v.id_venta} · {v.Cliente?.nombre ?? 'Cliente'}</p>
                      <p className="text-xs text-stone-500">{new Date(v.fecha).toLocaleString('es-BO')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${etiqueta.clase}`}>{etiqueta.texto}</span>
                      <span className="font-bold text-stone-900">{moneda.format(Number(v.total))}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-stone-200 bg-primary/10 px-6 py-4 text-sm font-semibold text-nube-oscuro">
              {cargandoVentas ? (
                <span role="status">Cargando ventas…</span>
              ) : (
                <>Total con pago confirmado: {moneda.format(totalConfirmado)} ({confirmadas.length} {confirmadas.length === 1 ? 'venta' : 'ventas'})</>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
