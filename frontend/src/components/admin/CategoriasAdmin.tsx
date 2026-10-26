// frontend/src/components/admin/CategoriasAdmin.tsx
import React, { useEffect, useState } from 'react';
import type { Categoria } from '../../interfaces';
import {
  actualizarCategoriaAPI,
  crearCategoriaAPI,
  eliminarCategoriaAPI,
  obtenerCategoriasAPI,
} from '../../services/apiService';

interface CategoriasAdminProps {
  onMostrarMensaje: (msg: string, esError: boolean) => void;
  onSetCargando: (cargando: boolean) => void;
}

const claseCampo =
  'w-full rounded-lg border border-stone-300 bg-white px-3 py-2.5 text-sm text-stone-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30';
const claseEtiquetaCampo = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500';

/* ------------------------------------------------------------------ */
/*  Formulario (crear / editar)                                        */
/* ------------------------------------------------------------------ */
interface FormularioCategoriaProps {
  categoria: Categoria | null;
  onCerrar: () => void;
  onGuardada: () => void;
  onMostrarMensaje: (msg: string, esError: boolean) => void;
  onSetCargando: (cargando: boolean) => void;
}

const FormularioCategoria: React.FC<FormularioCategoriaProps> = ({
  categoria,
  onCerrar,
  onGuardada,
  onMostrarMensaje,
  onSetCargando,
}) => {
  const [nombre, setNombre] = useState(categoria?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(categoria?.descripcion ?? '');
  const [guardando, setGuardando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      onMostrarMensaje('El nombre de la categoría es obligatorio.', true);
      return;
    }
    setGuardando(true);
    onSetCargando(true);
    try {
      const datos = { nombre: nombre.trim(), descripcion: descripcion.trim() };
      const res = categoria
        ? await actualizarCategoriaAPI(categoria.id_categoria, datos)
        : await crearCategoriaAPI(datos);
      if (res.success) {
        onMostrarMensaje(categoria ? 'Categoría actualizada.' : 'Categoría creada.', false);
        onGuardada();
      } else {
        onMostrarMensaje(res.error || res.mensaje || 'No se pudo guardar la categoría.', true);
      }
    } catch {
      onMostrarMensaje('Error de red al guardar la categoría.', true);
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
        className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
      >
        <header className="flex items-center justify-between border-b border-stone-200 bg-nube-crema px-6 py-4">
          <h3 className="font-serif text-xl font-bold text-stone-900">{categoria ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded-full p-2 text-stone-500 hover:bg-stone-200/70">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </header>

        <div className="space-y-4 p-6">
          <div>
            <label htmlFor="c-nombre" className={claseEtiquetaCampo}>Nombre *</label>
            <input
              id="c-nombre"
              autoFocus
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              maxLength={100}
              placeholder="Ej. Sérums"
              className={claseCampo}
            />
          </div>
          <div>
            <label htmlFor="c-desc" className={claseEtiquetaCampo}>Descripción</label>
            <textarea
              id="c-desc"
              rows={3}
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              maxLength={1000}
              placeholder="Qué tipo de productos agrupa esta categoría"
              className={claseCampo}
            />
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
            {guardando ? 'Guardando…' : categoria ? 'Guardar cambios' : 'Crear categoría'}
          </button>
        </footer>
      </form>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/*  Lista de categorías                                                */
/* ------------------------------------------------------------------ */
export const CategoriasAdmin: React.FC<CategoriasAdminProps> = ({ onMostrarMensaje, onSetCargando }) => {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [cargado, setCargado] = useState(false);
  const [editando, setEditando] = useState<Categoria | 'nueva' | null>(null);
  const [aEliminar, setAEliminar] = useState<Categoria | null>(null);

  const cargar = async () => {
    onSetCargando(true);
    try {
      setCategorias(await obtenerCategoriasAPI());
    } catch (err) {
      onMostrarMensaje(err instanceof Error ? err.message : 'No se pudieron cargar las categorías.', true);
    } finally {
      setCargado(true);
      onSetCargando(false);
    }
  };

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eliminar = async () => {
    if (!aEliminar) return;
    const categoria = aEliminar;
    setAEliminar(null);
    onSetCargando(true);
    try {
      const res = await eliminarCategoriaAPI(categoria.id_categoria);
      if (res.success) {
        onMostrarMensaje('Categoría eliminada.', false);
        await cargar();
      } else {
        onMostrarMensaje(res.error || res.mensaje || 'No se pudo eliminar la categoría.', true);
      }
    } catch {
      onMostrarMensaje('Error de red al eliminar la categoría.', true);
    } finally {
      onSetCargando(false);
    }
  };

  const alGuardar = () => {
    setEditando(null);
    cargar();
  };

  return (
    <section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-serif text-2xl font-bold text-stone-900">Categorías</h3>
          <p className="text-sm text-stone-500">Agrupan tus productos en el catálogo. Una categoría solo se puede eliminar si no tiene productos.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditando('nueva')}
          className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primaryFocus"
        >
          + Nueva categoría
        </button>
      </div>

      {cargado && categorias.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-3xl border border-dashed border-stone-300 bg-nube-crema px-6 py-14 text-center">
          <svg className="h-12 w-12 text-stone-300" fill="none" stroke="currentColor" strokeWidth="1.4" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12V4h8l9 9-8 8-9-9zM7.5 8.5h.01" />
          </svg>
          <p className="font-serif text-lg font-bold text-stone-800">Todavía no hay categorías</p>
          <p className="text-sm text-stone-500">Crea la primera para empezar a ordenar tu catálogo.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categorias.map(cat => {
            const total = cat.Productos?.length ?? 0;
            return (
              <li
                key={cat.id_categoria}
                className="flex flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-primary/60 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 font-serif text-lg font-bold text-nube-oscuro">
                    {cat.nombre.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <h4 className="truncate font-serif text-lg font-bold text-stone-900" title={cat.nombre}>{cat.nombre}</h4>
                    <span className="mt-1 inline-block rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-semibold text-stone-600">
                      {total} {total === 1 ? 'producto' : 'productos'}
                    </span>
                  </div>
                </div>

                <p className={`mt-3 line-clamp-2 flex-1 text-sm ${cat.descripcion ? 'text-stone-600' : 'italic text-stone-400'}`}>
                  {cat.descripcion || 'Sin descripción'}
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-stone-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setEditando(cat)}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-nube-oscuro transition hover:bg-primary/10"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => setAEliminar(cat)}
                    disabled={total > 0}
                    title={total > 0 ? 'Cambia o elimina sus productos primero' : 'Eliminar categoría'}
                    className="rounded-lg px-3 py-1.5 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:hover:bg-transparent"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {editando && (
        <FormularioCategoria
          categoria={editando === 'nueva' ? null : editando}
          onCerrar={() => setEditando(null)}
          onGuardada={alGuardar}
          onMostrarMensaje={onMostrarMensaje}
          onSetCargando={onSetCargando}
        />
      )}

      {aEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setAEliminar(null)}>
          <div role="alertdialog" aria-modal="true" onClick={e => e.stopPropagation()} className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
            <h4 className="font-serif text-xl font-bold text-stone-900">¿Eliminar categoría?</h4>
            <p className="mt-2 text-sm text-stone-600">
              Se eliminará <b>{aEliminar.nombre}</b>. Esta acción no se puede deshacer.
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