import React from 'react';

interface Props {
  titulo: string;
  mensaje: string;
  aviso?: string;
  textoConfirmar: string;
  textoCancelar?: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}

export const ConfirmacionDialog: React.FC<Props> = ({
  titulo,
  mensaje,
  aviso,
  textoConfirmar,
  textoCancelar = 'Volver',
  onConfirmar,
  onCancelar,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/50 p-4" onClick={onCancelar}>
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirmacion-dialog-titulo"
      onClick={e => e.stopPropagation()}
      className="w-full max-w-md rounded-3xl border border-stone-200 bg-white p-6 shadow-2xl"
    >
      <div className="flex items-start gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xl font-bold text-nube-oscuro" aria-hidden="true">
          !
        </span>
        <div>
          <h3 id="confirmacion-dialog-titulo" className="font-serif text-xl font-bold text-stone-900">{titulo}</h3>
          <p className="mt-2 text-sm leading-relaxed text-stone-600">{mensaje}</p>
        </div>
      </div>
      {aviso && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {aviso}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-xl px-5 py-2.5 text-sm font-semibold text-stone-600 transition hover:bg-stone-100"
        >
          {textoCancelar}
        </button>
        <button
          type="button"
          onClick={onConfirmar}
          className="rounded-xl bg-rose-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-800"
        >
          {textoConfirmar}
        </button>
      </div>
    </div>
  </div>
);
