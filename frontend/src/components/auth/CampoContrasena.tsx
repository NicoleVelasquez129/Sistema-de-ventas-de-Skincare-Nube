// frontend/src/components/auth/CampoContrasena.tsx
import React, { useState } from 'react';

interface CampoContrasenaProps {
  id: string;
  etiqueta: string;
  valor: string;
  onCambio: (valor: string) => void;
  autoComplete: string;
  ayuda?: string;
}

export const CampoContrasena: React.FC<CampoContrasenaProps> = ({ id, etiqueta, valor, onCambio, autoComplete, ayuda }) => {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500">
        {etiqueta}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          value={valor}
          onChange={e => onCambio(e.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-xl border border-stone-300 bg-white py-3 pl-4 pr-12 text-sm text-stone-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-stone-400 hover:text-stone-700"
        >
          {visible ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 5.1A9.7 9.7 0 0112 5c5 0 9 4.5 10 7-.4 1-1.2 2.3-2.4 3.5M6.2 6.2C4 7.7 2.6 9.9 2 12c1 2.5 5 7 10 7 1.6 0 3.1-.4 4.4-1" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2 12c1-2.5 5-7 10-7s9 4.5 10 7c-1 2.5-5 7-10 7S3 14.5 2 12z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {ayuda && <p className="mt-1 text-xs text-stone-400">{ayuda}</p>}
    </div>
  );
};