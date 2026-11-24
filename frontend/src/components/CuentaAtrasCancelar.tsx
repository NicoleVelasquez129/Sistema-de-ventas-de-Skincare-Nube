import React, { useEffect, useState } from 'react';

const VENTANA_MS = 20 * 60 * 1000;

interface Props {
  creadaEn: string;
  texto: string;
  cancelando: boolean;
  onCancelar: () => void;
}

export const CuentaAtrasCancelar: React.FC<Props> = ({ creadaEn, texto, cancelando, onCancelar }) => {
  const limite = Date.parse(creadaEn) + VENTANA_MS;
  const [restante, setRestante] = useState(() => limite - Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setRestante(limite - Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [limite]);

  if (!Number.isFinite(restante) || restante <= 0) return null;

  const minutos = Math.floor(restante / 60000);
  const segundos = Math.floor((restante % 60000) / 1000);

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={onCancelar}
        disabled={cancelando}
        className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {cancelando ? 'Anulando…' : texto}
      </button>
      <span className="text-[10px] font-semibold text-rose-600">
        Tiempo para anular: {minutos}:{String(segundos).padStart(2, '0')}
      </span>
    </div>
  );
};
