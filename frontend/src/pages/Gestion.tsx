import React, { useState } from 'react';
import { ProductosAdmin } from '../components/admin/ProductosAdmin';
import { CategoriasAdmin } from '../components/admin/CategoriasAdmin';

interface GestionProps {
  onMostrarMensaje: (msg: string, esError: boolean) => void;
  onSetCargando: (cargando: boolean) => void;
}

const PESTANAS = [
  { id: 'productos', texto: 'Productos' },
  { id: 'categorias', texto: 'Categorías' },
] as const;

export const Gestion: React.FC<GestionProps> = ({ onMostrarMensaje, onSetCargando }) => {
  const [pestana, setPestana] = useState<'productos' | 'categorias'>('productos');

  return (
    <div className="fade-in mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <div className="mb-6">
        <h2 className="font-serif text-3xl font-bold text-stone-900">Panel de gestión</h2>
        <p className="text-sm text-stone-500">Administra tu catálogo y tus categorías.</p>
      </div>

      <div role="tablist" className="mb-8 flex gap-2 overflow-x-auto border-b border-stone-200">
        {PESTANAS.map(p => (
          <button
            key={p.id}
            role="tab"
            type="button"
            aria-selected={pestana === p.id}
            onClick={() => setPestana(p.id)}
            className={`-mb-px whitespace-nowrap border-b-2 px-5 py-3 text-sm font-semibold transition ${
              pestana === p.id ? 'border-primary text-nube-oscuro' : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {p.texto}
          </button>
        ))}
      </div>

      {pestana === 'productos' && <ProductosAdmin onMostrarMensaje={onMostrarMensaje} onSetCargando={onSetCargando} />}
      {pestana === 'categorias' && <CategoriasAdmin onMostrarMensaje={onMostrarMensaje} onSetCargando={onSetCargando} />}
    </div>
  );
};