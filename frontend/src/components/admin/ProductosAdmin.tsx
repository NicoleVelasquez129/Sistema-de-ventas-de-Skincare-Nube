// frontend/src/components/admin/ProductosAdmin.tsx
import React, { useEffect, useMemo, useState } from 'react';
import type { Categoria, Producto } from '../../interfaces';
import {
  actualizarProductoAPI,
  crearProductoAPI,
  eliminarProductoDefinitivoAPI,
  obtenerCategoriasAPI,
  obtenerProductosAPI,
  subirImagenAPI,
  urlImagen,
} from '../../services/apiService';
import type { DatosProducto } from '../../services/apiService';

interface ProductosAdminProps {
  onMostrarMensaje: (msg: string, esError: boolean) => void;
  onSetCargando: (cargando: boolean) => void;
}

const ETIQUETAS = ['Más vendido', 'Recomendado', 'Nuevo', 'Top UV'];
const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGEN_BYTES = 5 * 1024 * 1024;

const claseCampo =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30';
const claseEtiquetaCampo = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500';

const dinero = (valor: number | string) => `$${Number(valor).toFixed(2)}`;

/* ------------------------------------------------------------------ */
/*  Formulario (crear / editar)                                        */
/* ------------------------------------------------------------------ */
interface FormularioProps {
  producto: Producto | null;
  categorias: Categoria[];
  onCerrar: () => void;
  onGuardado: () => void;
  onMostrarMensaje: (msg: string, esError: boolean) => void;
  onSetCargando: (cargando: boolean) => void;
}

const FormularioProducto: React.FC<FormularioProps> = ({
  producto,
  categorias,
  onCerrar,
  onGuardado,
  onMostrarMensaje,
  onSetCargando,
}) => {
  const [nombre, setNombre] = useState(producto?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(producto?.descripcion ?? '');
  const [ingredientes, setIngredientes] = useState(producto?.ingredientes ?? '');
  const [modoUso, setModoUso] = useState(producto?.modo_uso ?? '');
  const [etiqueta, setEtiqueta] = useState(producto?.etiqueta ?? '');
  const [precio, setPrecio] = useState(producto ? String(producto.precio) : '');
  const [stock, setStock] = useState(producto ? String(producto.stock) : '');
  const [stockMinimo, setStockMinimo] = useState(producto?.stock_minimo !== undefined ? String(producto.stock_minimo) : '5');
  const [idCategoria, setIdCategoria] = useState(producto ? String(producto.id_categoria ?? '') : '');
  const [activo, setActivo] = useState(producto ? producto.activo !== false : true);
  const [imagenActual, setImagenActual] = useState(producto?.imagen ?? '');
  const [archivo, setArchivo] = useState<File | null>(null);
  const [vistaArchivo, setVistaArchivo] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!archivo) {
      setVistaArchivo('');
      return undefined;
    }
    const url = URL.createObjectURL(archivo);
    setVistaArchivo(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const vistaPrevia = vistaArchivo || urlImagen(imagenActual);
  const etiquetasDisponibles = etiqueta && !ETIQUETAS.includes(etiqueta) ? [...ETIQUETAS, etiqueta] : ETIQUETAS;

  const elegirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const elegido = e.target.files?.[0];
    e.target.value = '';
    if (!elegido) return;
    if (!TIPOS_IMAGEN.includes(elegido.type)) {
      onMostrarMensaje('Solo se permiten imágenes JPG, PNG o WEBP.', true);
      return;
    }
    if (elegido.size > MAX_IMAGEN_BYTES) {
      onMostrarMensaje('La imagen supera el máximo de 5 MB.', true);
      return;
    }
    setArchivo(elegido);
  };

  const quitarImagen = () => {
    setArchivo(null);
    setImagenActual('');
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const precioNum = Number(precio);
    const stockNum = Number(stock);
    const minimoNum = Number(stockMinimo);

    if (!nombre.trim()) return onMostrarMensaje('El nombre es obligatorio.', true);
    if (!idCategoria) return onMostrarMensaje('Selecciona una categoría.', true);
    if (precio === '' || !Number.isFinite(precioNum) || precioNum <= 0 || precioNum > 5000) {
      return onMostrarMensaje('El precio debe ser mayor a 0 y no superar Bs 5.000.', true);
    }
    if (stock === '' || !Number.isInteger(stockNum) || stockNum < 1 || stockNum > 200) {
      return onMostrarMensaje('El stock debe ser un número entero entre 1 y 200.', true);
    }
    if (stockMinimo === '' || !Number.isInteger(minimoNum) || minimoNum < 0 || minimoNum > 200) {
      return onMostrarMensaje('El stock mínimo debe ser un número entero entre 0 y 200.', true);
    }

    setGuardando(true);
    onSetCargando(true);
    try {
      let imagen: string | null = imagenActual.trim() || null;
      if (archivo) imagen = await subirImagenAPI(archivo);

      const datos: DatosProducto = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        imagen,
        ingredientes: ingredientes.trim() || null,
        modo_uso: modoUso.trim() || null,
        etiqueta: etiqueta || null,
        precio: precioNum,
        stock: stockNum,
        stock_minimo: minimoNum,
        id_categoria: Number(idCategoria),
        activo,
      };

      const res = producto
        ? await actualizarProductoAPI(producto.id_producto, datos)
        : await crearProductoAPI(datos);

      if (res.success) {
        onMostrarMensaje(producto ? 'Producto actualizado.' : 'Producto creado.', false);
        onGuardado();
      } else {
        onMostrarMensaje(res.error || res.mensaje || 'No se pudo guardar el producto.', true);
      }
    } catch (err) {
      onMostrarMensaje(err instanceof Error ? err.message : 'Error de red al guardar el producto.', true);
    } finally {
      setGuardando(false);
      onSetCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onCerrar}>
      <form
        onSubmit={guardar}
        onClick={event => event.stopPropagation()}
        className="flex max-h-[95vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="flex items-center justify-between border-b border-stone-200 bg-nube-crema px-6 py-4">
          <h3 className="font-serif text-xl font-bold text-stone-900">{producto ? 'Editar producto' : 'Nuevo producto'}</h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-full p-2 text-stone-500 hover:bg-stone-200/70">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="grid flex-1 gap-6 overflow-y-auto p-6 md:grid-cols-[220px_1fr]">
          {/* Imagen */}
          <div>
            <span className={claseEtiquetaCampo}>Imagen</span>
            <div className="flex aspect-[4/5] w-full items-center justify-center overflow-hidden rounded-t-[999px] rounded-b-2xl border border-stone-200 bg-stone-50">
              {vistaPrevia ? (
                <img src={vistaPrevia} alt="Vista previa" className="h-full w-full object-cover" />
              ) : (
                <span className="px-4 text-center text-xs text-stone-400">Sin imagen</span>
              )}
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <label className="cursor-pointer rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-white transition hover:bg-primaryFocus">
                {vistaPrevia ? 'Cambiar imagen' : 'Elegir imagen'}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={elegirArchivo} />
              </label>
              {vistaPrevia && (
                <button type="button" onClick={quitarImagen} className="text-xs font-semibold text-rose-600 hover:underline">
                  Quitar imagen
                </button>
              )}
              <p className="text-[11px] leading-snug text-stone-400">JPG, PNG o WEBP, máximo 5 MB. En el celular puedes usar la galería o la cámara.</p>
              <div>
                <label htmlFor="imagen-url" className={claseEtiquetaCampo}>o pega una URL</label>
                <input
                  id="imagen-url"
                  type="url"
                  value={archivo ? '' : imagenActual.startsWith('/uploads/') ? '' : imagenActual}
                  onChange={e => setImagenActual(e.target.value)}
                  disabled={!!archivo}
                  placeholder="https://..."
                  className={`${claseCampo} disabled:bg-stone-100`}
                />
              </div>
            </div>
          </div>

          {/* Datos */}
          <div className="grid content-start gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="p-nombre" className={claseEtiquetaCampo}>Nombre *</label>
              <input id="p-nombre" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={150} className={claseCampo} />
            </div>

            <div>
              <label htmlFor="p-categoria" className={claseEtiquetaCampo}>Categoría *</label>
              <select id="p-categoria" value={idCategoria} onChange={e => setIdCategoria(e.target.value)} className={claseCampo}>
                <option value="">Selecciona…</option>
                {categorias.map(c => (
                  <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="p-etiqueta" className={claseEtiquetaCampo}>Etiqueta</label>
              <select id="p-etiqueta" value={etiqueta} onChange={e => setEtiqueta(e.target.value)} className={claseCampo}>
                <option value="">Sin etiqueta</option>
                {etiquetasDisponibles.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="p-precio" className={claseEtiquetaCampo}>Precio *</label>
              <input id="p-precio" type="number" min="0" step="0.01" inputMode="decimal" value={precio} onChange={e => setPrecio(e.target.value)} className={claseCampo} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="p-stock" className={claseEtiquetaCampo}>Stock *</label>
                <input id="p-stock" type="number" min="0" step="1" inputMode="numeric" value={stock} onChange={e => setStock(e.target.value)} className={claseCampo} />
              </div>
              <div>
                <label htmlFor="p-minimo" className={claseEtiquetaCampo}>Stock mín.</label>
                <input id="p-minimo" type="number" min="0" step="1" inputMode="numeric" value={stockMinimo} onChange={e => setStockMinimo(e.target.value)} className={claseCampo} />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label htmlFor="p-desc" className={claseEtiquetaCampo}>Descripción</label>
              <textarea id="p-desc" rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} className={claseCampo} />
            </div>

            <div>
              <label htmlFor="p-ingr" className={claseEtiquetaCampo}>Ingredientes</label>
              <textarea id="p-ingr" rows={3} value={ingredientes} onChange={e => setIngredientes(e.target.value)} className={claseCampo} />
            </div>

            <div>
              <label htmlFor="p-uso" className={claseEtiquetaCampo}>Modo de uso</label>
              <textarea id="p-uso" rows={3} value={modoUso} onChange={e => setModoUso(e.target.value)} className={claseCampo} />
            </div>

            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 sm:col-span-2">
              <span>
                <span className="block text-sm font-semibold text-stone-800">{activo ? 'Activo: visible para los clientes' : 'Inactivo: oculto para los clientes'}</span>
                <span className="block text-xs text-stone-500">Tú siempre lo ves en este panel, esté activo o no.</span>
              </span>
              <input type="checkbox" className="toggle toggle-primary" checked={activo} onChange={e => setActivo(e.target.checked)} />
            </label>
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-stone-200 bg-nube-crema px-6 py-4">
          <button type="button" onClick={onCerrar} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-200/70">
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-primaryFocus disabled:opacity-60"
          >
            {guardando ? 'Guardando…' : producto ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </footer>
      </form>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Lista de productos                                                 */
/* ------------------------------------------------------------------ */
export const ProductosAdmin: React.FC<ProductosAdminProps> = ({ onMostrarMensaje, onSetCargando }) => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activos' | 'inactivos'>('todos');
  const [editando, setEditando] = useState<Producto | 'nuevo' | null>(null);
  const [aEliminar, setAEliminar] = useState<Producto | null>(null);

  const cargar = async () => {
    onSetCargando(true);
    try {
      const [prods, cats] = await Promise.all([obtenerProductosAPI(true), obtenerCategoriasAPI()]);
      setProductos(prods);
      setCategorias(cats);
    } catch (err) {
      onMostrarMensaje(err instanceof Error ? err.message : 'No se pudieron cargar los productos.', true);
    } finally {
      onSetCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    return productos.filter(p => {
      if (filtroEstado === 'activos' && p.activo === false) return false;
      if (filtroEstado === 'inactivos' && p.activo !== false) return false;
      return !texto || p.nombre.toLowerCase().includes(texto);//examen
    });
  }, [productos, busqueda, filtroEstado]);

  const cambiarEstado = async (p: Producto) => {
    onSetCargando(true);
    try {
      const res = await actualizarProductoAPI(p.id_producto, { activo: p.activo === false });
      if (res.success) {
        onMostrarMensaje(p.activo === false ? 'Producto activado: ya lo ven los clientes.' : 'Producto desactivado: los clientes ya no lo ven.', false);
        await cargar();
      } else {
        onMostrarMensaje(res.error || res.mensaje || 'No se pudo cambiar el estado.', true);
      }
    } catch {
      onMostrarMensaje('Error de red al cambiar el estado.', true);
    } finally {
      onSetCargando(false);
    }
  };

  const eliminar = async () => {
    if (!aEliminar) return;
    const producto = aEliminar;
    setAEliminar(null);
    onSetCargando(true);
    try {
      const res = await eliminarProductoDefinitivoAPI(producto.id_producto);
      if (res.success) {
        onMostrarMensaje('Producto eliminado definitivamente.', false);
        await cargar();
      } else {
        onMostrarMensaje(res.error || res.mensaje || 'No se pudo eliminar el producto.', true);
      }
    } catch {
      onMostrarMensaje('Error de red al eliminar el producto.', true);
    } finally {
      onSetCargando(false);
    }
  };

  const cerrarFormulario = () => setEditando(null);
  const alGuardar = () => {
    setEditando(null);
    cargar();
  };

  return (
    <section>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">Productos</h3>
          <p className="text-sm text-stone-500">{productos.length} en total · tú ves todos, los clientes solo los activos.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditando('nuevo')}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primaryFocus"
        >
          + Nuevo producto
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="search"
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre…"
          aria-label="Buscar producto"//examen
          className={`${claseCampo} sm:max-w-xs`}
        />
        <div className="flex gap-2">
          {(['todos', 'activos', 'inactivos'] as const).map(f => (
            <button
              key={f}
              type="button"
              onClick={() => setFiltroEstado(f)}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition ${
                filtroEstado === f ? 'border-primary bg-primary text-white' : 'border-stone-200 bg-white text-stone-600 hover:border-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="bg-nube-crema text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Visible</th>
              <th className="px-4 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {visibles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-stone-400">
                  {productos.length === 0 ? 'Aún no hay productos. Crea el primero.' : 'No hay productos con ese filtro.'}
                </td>
              </tr>
            )}
            {visibles.map(p => {
              const inactivo = p.activo === false;
              const agotado = p.stock <= 0;
              const bajo = !agotado && p.stock_minimo !== undefined && p.stock <= p.stock_minimo;
              return (
                <tr key={p.id_producto} className={inactivo ? 'bg-stone-50/70' : ''}>
                  <td className="px-4 py-3">
                    <div className={`flex items-center gap-3 ${inactivo ? 'opacity-60' : ''}`}>
                      <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-stone-200 bg-stone-50">
                        {p.imagen ? (
                          <img src={urlImagen(p.imagen)} alt={p.nombre} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-stone-400">Sin foto</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-stone-900">{p.nombre}</p>
                        <p className="text-xs text-stone-500">
                          {p.Categoria?.nombre ?? 'Sin categoría'}
                          {p.etiqueta && <span className="ml-2 rounded-full bg-stone-900 px-2 py-0.5 text-[10px] font-bold uppercase text-white">{p.etiqueta}</span>}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-stone-800">{dinero(p.precio)}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-stone-800">{p.stock}</span>
                    {agotado && <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[11px] font-semibold text-rose-700">Agotado</span>}
                    {bajo && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-700">Stock bajo</span>}
                  </td>
                  <td className="px-4 py-3">
                    <label className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        className="toggle toggle-sm toggle-primary"
                        checked={!inactivo}
                        onChange={() => cambiarEstado(p)}
                        aria-label={inactivo ? `Activar ${p.nombre}` : `Desactivar ${p.nombre}`}
                      />
                      <span className="text-xs text-stone-500">{inactivo ? 'Inactivo' : 'Activo'}</span>
                    </label>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setEditando(p)}
                        className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-stone-700 transition hover:border-primary hover:text-nube-oscuro"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => setAEliminar(p)}
                        className="rounded-lg border border-stone-200 px-3 py-1.5 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editando && (
        <FormularioProducto
          producto={editando === 'nuevo' ? null : editando}
          categorias={categorias}
          onCerrar={cerrarFormulario}
          onGuardado={alGuardar}
          onMostrarMensaje={onMostrarMensaje}
          onSetCargando={onSetCargando}
        />
      )}

      {aEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAEliminar(null)}>
          <div role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="font-serif text-xl font-bold text-stone-900">¿Eliminar definitivamente?</h4>
            <p className="mt-2 text-sm text-stone-600">
              Se eliminará <b>{aEliminar.nombre}</b> y no se podrá recuperar. Si ya tiene ventas registradas no se puede eliminar; en ese caso déjalo inactivo para ocultarlo a los clientes.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setAEliminar(null)} className="rounded-xl px-5 py-2.5 text-sm font-semibold text-stone-600 hover:bg-stone-100">
                Cancelar
              </button>
              <button type="button" onClick={eliminar} className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};