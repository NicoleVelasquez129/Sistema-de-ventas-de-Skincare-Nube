const API_URL = 'http://localhost:3000/api';
const CLAVE_TOKEN = 'skinker_token';
const CLAVE_USUARIO = 'skinker_usuario';

export interface UsuarioSesion {
  id_usuario: number;
  nombre: string;
  correo: string;
  rol: 'administrador' | 'cliente';
}

const tokenVigente = (token: string): boolean => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
};

export const cerrarSesion = () => {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
};

export const obtenerToken = (): string | null => {
  const token = localStorage.getItem(CLAVE_TOKEN);
  if (token && !tokenVigente(token)) {
    cerrarSesion();
    return null;
  }
  return token;
};

export const obtenerUsuarioGuardado = (): UsuarioSesion | null => {
  if (!obtenerToken()) return null;
  try {
    return JSON.parse(localStorage.getItem(CLAVE_USUARIO) || 'null');
  } catch {
    return null;
  }
};

export const cabecerasAuth = (): Record<string, string> => {
  const token = obtenerToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const loginAPI = async (correo: string, contrasena: string) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, contrasena }),
  });
  const data = await response.json();
  if (data.success) {
    localStorage.setItem(CLAVE_TOKEN, data.data.token);
    localStorage.setItem(CLAVE_USUARIO, JSON.stringify(data.data.usuario));
    return { success: true, usuario: data.data.usuario as UsuarioSesion };
  }
  return { success: false, error: (data.error || data.mensaje || 'No se pudo iniciar sesión') as string };
};
const guardarSesion = (datos: { token: string; usuario: UsuarioSesion }) => {
  localStorage.setItem(CLAVE_TOKEN, datos.token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(datos.usuario));
};

export const registroAPI = async (datos: { nombre: string; correo: string; contrasena: string; telefono?: string }) => {
  const response = await fetch(`${API_URL}/auth/registro`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(datos),
  });
  const data = await response.json();
  if (data.success) {
    guardarSesion(data.data);
    return { success: true, usuario: data.data.usuario as UsuarioSesion };
  }
  return { success: false, error: (data.error || data.mensaje || 'No se pudo crear la cuenta') as string };
};

export const olvideContrasenaAPI = async (correo: string) => {
  const response = await fetch(`${API_URL}/auth/olvide-contrasena`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo }),
  });
  const data = await response.json();
  return data.success
    ? { success: true, mensaje: data.mensaje as string }
    : { success: false, error: (data.error || data.mensaje || 'No se pudo procesar la solicitud') as string };
};

export const restablecerContrasenaAPI = async (token: string, contrasena: string) => {
  const response = await fetch(`${API_URL}/auth/restablecer-contrasena`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, contrasena }),
  });
  const data = await response.json();
  return data.success
    ? { success: true, mensaje: data.mensaje as string }
    : { success: false, error: (data.error || data.mensaje || 'No se pudo cambiar la contraseña') as string };
};