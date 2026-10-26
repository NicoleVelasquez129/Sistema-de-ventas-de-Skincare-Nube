import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { restablecerContrasenaAPI } from '../services/authService';
import { CampoContrasena } from '../components/auth/CampoContrasena.tsx';

export const RestablecerContrasena: React.FC = () => {
  const [parametros] = useSearchParams();
  const token = parametros.get('token') || '';
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (contrasena.length < 8 || !/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
      return setError('La contraseña debe tener al menos 8 caracteres, con letras y números.');
    }
    if (contrasena !== confirmar) return setError('Las contraseñas no coinciden.');
    setProcesando(true);
    try {
      const res = await restablecerContrasenaAPI(token, contrasena);
      if (res.success) setListo(true);
      else setError(res.error || 'No se pudo cambiar la contraseña.');
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fade-in mx-auto flex min-h-[calc(100vh-5rem)] max-w-md items-center px-4 py-10">
      <div className="w-full rounded-3xl border border-stone-200 bg-white p-8 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-nube-oscuro">Skincare Nube</p>
        <h1 className="mt-2 font-serif text-2xl font-bold text-stone-900">Elige tu nueva contraseña</h1>

        {!token ? (
          <div className="mt-6 space-y-4">
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              Este enlace no es válido. Solicita uno nuevo desde el inicio de sesión.
            </p>
            <Link to="/login" className="block rounded-xl bg-primary py-3 text-center text-sm font-bold text-white hover:bg-primaryFocus">
              Ir a iniciar sesión
            </Link>
          </div>
        ) : listo ? (
          <div className="mt-6 space-y-4">
            <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Tu contraseña se actualizó. Ya puedes iniciar sesión.
            </p>
            <Link to="/login" className="block rounded-xl bg-primary py-3 text-center text-sm font-bold text-white hover:bg-primaryFocus">
              Iniciar sesión
            </Link>
          </div>
        ) : (
          <form onSubmit={guardar} className="mt-6 space-y-4" noValidate>
            {error && (
              <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                {error}
              </div>
            )}
            <CampoContrasena
              id="n-clave"
              etiqueta="Nueva contraseña"
              valor={contrasena}
              onCambio={setContrasena}
              autoComplete="new-password"
              ayuda="Mínimo 8 caracteres, con letras y números."
            />
            <CampoContrasena id="n-clave2" etiqueta="Repite la contraseña" valor={confirmar} onCambio={setConfirmar} autoComplete="new-password" />
            <button type="submit" disabled={procesando} className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white transition hover:bg-primaryFocus disabled:opacity-60">
              {procesando ? 'Guardando…' : 'Guardar contraseña'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};