import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginAPI } from '../services/authService';
import type { UsuarioSesion } from '../services/authService';

interface LoginProps {
  onLogin: (usuario: UsuarioSesion) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [procesando, setProcesando] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!correo.trim() || !contrasena) {
      setError('Ingrese su correo y contraseña.');
      return;
    }
    setProcesando(true);
    try {
      const res = await loginAPI(correo, contrasena);
      if (res.success && res.usuario) {
        onLogin(res.usuario);
        navigate(res.usuario.rol === 'administrador' ? '/ventas' : '/');
      } else {
        setError(res.error || 'No se pudo iniciar sesión.');
      }
    } catch {
      setError('Error de conexión con el servidor.');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: '400px', margin: '3rem auto', padding: '0 1rem' }}>
      <form
        onSubmit={handleSubmit}
        style={{ backgroundColor: 'var(--bg-card)', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 4px rgba(0,0,0,0.03)' }}
      >
        <h2 style={{ marginTop: 0, color: '#0f766e' }}>☁️ Iniciar sesión</h2>

        {error && (
          <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '0.7rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.9rem' }}>
            ⚠️ {error}
          </div>
        )}

        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem' }}>Correo</label>
        <input
          type="email"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          autoComplete="username"
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1rem' }}
        />

        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem' }}>Contraseña</label>
        <input
          type="password"
          value={contrasena}
          onChange={(e) => setContrasena(e.target.value)}
          autoComplete="current-password"
          style={{ width: '100%', boxSizing: 'border-box', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', marginBottom: '1.5rem' }}
        />

        <button
          type="submit"
          disabled={procesando}
          style={{ width: '100%', padding: '0.8rem', backgroundColor: 'var(--primary)', color: '#065f46', border: '1px solid #5bb3a9', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          {procesando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
};