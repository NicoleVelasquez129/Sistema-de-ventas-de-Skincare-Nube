import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginAPI, olvideContrasenaAPI, registroAPI } from '../services/authService';
import type { UsuarioSesion } from '../services/authService';
import { CampoContrasena } from '../components/auth/CampoContrasena.tsx';

interface LoginProps {
  onLogin: (usuario: UsuarioSesion) => void;
}

type Vista = 'login' | 'registro' | 'olvide';

const claseCampo =
  'w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-800 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/30';
const claseEtiqueta = 'mb-1 block text-xs font-semibold uppercase tracking-wide text-stone-500';
const claseBoton =
  'w-full rounded-xl bg-primary py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-primaryFocus disabled:opacity-60';

const REGEX_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ErrorCampo: React.FC<{ texto?: string }> = ({ texto }) =>
  texto ? <p role="alert" className="mt-1 text-xs text-rose-600">{texto}</p> : null;

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [vista, setVista] = useState<Vista>('login');
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [error, setError] = useState('');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [aviso, setAviso] = useState('');
  const [procesando, setProcesando] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const destinoPrevio = (location.state as { desde?: string } | null)?.desde;

  const cambiarVista = (nueva: Vista) => {
    setVista(nueva);
    setError('');
    setErrores({});
    setAviso('');
    setContrasena('');
    setConfirmar('');
  };

  const entrar = (usuario: UsuarioSesion) => {
    onLogin(usuario);
    navigate(usuario.rol === 'administrador' ? '/ventas' : usuario.rol === 'vendedor' ? '/vender' : destinoPrevio || '/');
  };

  const iniciarSesion = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const nuevos: Record<string, string> = {};
    if (!correo.trim()) nuevos.correo = 'Escribe tu correo.';
    if (!contrasena) nuevos.contrasena = 'Escribe tu contraseña.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    setProcesando(true);
    try {
      const res = await loginAPI(correo, contrasena);
      if (res.success && res.usuario) entrar(res.usuario);
      else setError(res.error || 'No se pudo iniciar sesión.');
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  const crearCuenta = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const nuevos: Record<string, string> = {};
    if (!nombre.trim()) nuevos.nombre = 'Escribe tu nombre.';
    if (!REGEX_CORREO.test(correo.trim())) nuevos.correo = 'Ingresa un correo válido.';
    if (!telefono.trim()) nuevos.telefono = 'Escribe tu celular.';
    if (contrasena.length < 8 || !/[A-Za-z]/.test(contrasena) || !/\d/.test(contrasena)) {
      nuevos.contrasena = 'Mínimo 8 caracteres, con letras y números.';
    }
    if (contrasena !== confirmar) nuevos.confirmar = 'Las contraseñas no coinciden.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;
    setProcesando(true);
    try {
      const res = await registroAPI({ nombre, correo, contrasena, telefono: telefono.trim() });
      if (res.success && res.usuario) entrar(res.usuario);
      else setError(res.error || 'No se pudo crear la cuenta.');
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  const pedirEnlace = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAviso('');
    if (!REGEX_CORREO.test(correo.trim())) return setErrores({ correo: 'Ingresa un correo válido.' });
    setErrores({});
    setProcesando(true);
    try {
      const res = await olvideContrasenaAPI(correo.trim());
      if (res.success) setAviso(res.mensaje || 'Revisa tu correo.');
      else setError(res.error || 'No se pudo procesar la solicitud.');
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fade-in mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl items-center px-4 py-10">
      <div className="grid w-full overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-xl md:grid-cols-2">
        {/* Panel de marca */}
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-primary to-nube-oscuro p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/15 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-white/80">Skincare Nube</p>
            <h2 className="mt-6 font-serif text-4xl font-bold leading-tight">Tu piel, ligera como una nube.</h2>
          </div>
          <ul className="relative mt-10 space-y-3 text-sm text-white/90">
            <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">✓</span>Compra en segundos con tu canastita</li>
            <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">✓</span>Recibe tu factura en tu correo</li>
            <li className="flex items-center gap-3"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/25">✓</span>Guarda tus productos favoritos</li>
          </ul>
        </aside>

        {/* Formulario */}
        <section className="p-6 sm:p-10">
          {vista !== 'olvide' && (
            <div role="tablist" className="mb-8 grid grid-cols-2 rounded-xl bg-stone-100 p-1 text-sm font-semibold">
              {(['login', 'registro'] as const).map(v => (
                <button
                  key={v}
                  role="tab"
                  type="button"
                  aria-selected={vista === v}
                  onClick={() => cambiarVista(v)}
                  className={`rounded-lg py-2.5 transition ${vista === v ? 'bg-white text-nube-oscuro shadow-sm' : 'text-stone-500 hover:text-stone-800'}`}
                >
                  {v === 'login' ? 'Ingresar' : 'Crear cuenta'}
                </button>
              ))}
            </div>
          )}

          {vista === 'login' && (
            <form onSubmit={iniciarSesion} className="space-y-4" noValidate>
              <div>
                <h1 className="font-serif text-2xl font-bold text-stone-900">Bienvenida de vuelta</h1>
                <p className="mt-1 text-sm text-stone-500">Ingresa con tu cuenta para continuar.</p>
              </div>
              <div>
                <label htmlFor="l-correo" className={claseEtiqueta}>Correo</label>
                <input id="l-correo" type="email" value={correo} onChange={e => setCorreo(e.target.value)} autoComplete="username" className={claseCampo} />
                <ErrorCampo texto={errores.correo} />
              </div>
              <CampoContrasena id="l-clave" etiqueta="Contraseña" valor={contrasena} onCambio={setContrasena} autoComplete="current-password" error={errores.contrasena} />
              <div className="text-right">
                <button type="button" onClick={() => cambiarVista('olvide')} className="text-sm rounded-xl bg-white px-4 py-2 text-sm font-semibold text-nube-oscuro ring-1 ring-primary/60 transition hover:bg-primary/15">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
              <button type="submit" disabled={procesando} className={claseBoton}>
                {procesando ? 'Ingresando…' : 'Ingresar'}
              </button>
              <p className="text-center text-sm text-stone-500">
                ¿Aún no tienes cuenta?{' '}
                <button type="button" onClick={() => cambiarVista('registro')} className="font-semibold text-nube-oscuro hover:underline">
                  Créala aquí
                </button>
              </p>
            </form>
          )}

          {vista === 'registro' && (
            <form onSubmit={crearCuenta} className="space-y-4" noValidate>
              <div>
                <h1 className="font-serif text-2xl font-bold text-stone-900">Crea tu cuenta</h1>
                <p className="mt-1 text-sm text-stone-500">La necesitas para comprar y recibir tu factura.</p>
              </div>
              <div>
                <label htmlFor="r-nombre" className={claseEtiqueta}>Nombre completo</label>
                <input id="r-nombre" value={nombre} onChange={e => setNombre(e.target.value)} maxLength={150} autoComplete="off" className={claseCampo} />
                <ErrorCampo texto={errores.nombre} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="r-correo" className={claseEtiqueta}>Correo</label>
                  <input id="r-correo" type="email" value={correo} onChange={e => setCorreo(e.target.value)} autoComplete="off" className={claseCampo} />
                  <ErrorCampo texto={errores.correo} />
                </div>
                <div>
                  <label htmlFor="r-tel" className={claseEtiqueta}>Celular</label>
                  <input id="r-tel" type="tel" value={telefono} onChange={e => setTelefono(e.target.value)} maxLength={50} autoComplete="off" className={claseCampo} />
                  <ErrorCampo texto={errores.telefono} />
                </div>
              </div>
              <CampoContrasena
                id="r-clave"
                etiqueta="Contraseña"
                valor={contrasena}
                onCambio={setContrasena}
                autoComplete="new-password"
                ayuda="Mínimo 8 caracteres, con letras y números."
                error={errores.contrasena}
              />
              <CampoContrasena id="r-clave2" etiqueta="Repite la contraseña" valor={confirmar} onCambio={setConfirmar} autoComplete="new-password" error={errores.confirmar} />
              {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
              <button type="submit" disabled={procesando} className={claseBoton}>
                {procesando ? 'Creando cuenta…' : 'Crear mi cuenta'}
              </button>
            </form>
          )}

          {vista === 'olvide' && (
            <form onSubmit={pedirEnlace} className="space-y-4" noValidate>
              <div>
                <h1 className="font-serif text-2xl font-bold text-stone-900">Recupera tu contraseña</h1>
                <p className="mt-1 text-sm text-stone-500">Escribe tu correo y te enviaremos un enlace para elegir una nueva. Vale 1 hora.</p>
              </div>
              {aviso ? (
                <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                  {aviso}
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="o-correo" className={claseEtiqueta}>Correo</label>
                    <input id="o-correo" type="email" value={correo} onChange={e => setCorreo(e.target.value)} autoComplete="off" className={claseCampo} />
                    <ErrorCampo texto={errores.correo} />
                  </div>
                  {error && <p role="alert" className="text-xs text-rose-600">{error}</p>}
                  <button type="submit" disabled={procesando} className={claseBoton}>
                    {procesando ? 'Enviando…' : 'Enviar enlace'}
                  </button>
                </>
              )}
              <p className="text-center text-sm">
                <button type="button" onClick={() => cambiarVista('login')} className="font-semibold text-nube-oscuro hover:underline">
                  ← Volver a iniciar sesión
                </button>
              </p>
            </form>
          )}
        </section>
      </div>
    </div>
  );
};