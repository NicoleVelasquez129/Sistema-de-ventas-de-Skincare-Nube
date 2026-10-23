import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { UsuarioSesion } from '../services/authService';

interface NavbarProps {
  usuario: UsuarioSesion | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ usuario, onLogout }) => {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const vistaActual = pathname === '/' ? 'catalogo' : pathname.slice(1);
  const setVista = (vista: 'catalogo' | 'ventas' | 'gestion') => navigate(vista === 'catalogo' ? '/' : `/${vista}`);
  const esAdmin = usuario?.rol === 'administrador';

  return (
    <nav
      className="navbar-container"
      style={{
        backgroundColor: '#ffffff',
        color: 'var(--text-main)',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '2px solid #e2e8f0',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span style={{ fontSize: '1.5rem' }}>☁️</span>
        <h2 style={{ margin: 0, color: '#0f766e', fontSize: '1.3rem', letterSpacing: '0.5px' }}>Skinker Nube</h2>
      </div>

      <div className="navbar-links" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        {usuario ? (
          <>
            <button
              onClick={() => setVista('catalogo')}
              style={{
                backgroundColor: vistaActual === 'catalogo' ? 'var(--primary)' : 'transparent',
                color: vistaActual === 'catalogo' ? '#065f46' : 'var(--text-muted)',
                border: vistaActual === 'catalogo' ? '1px solid #5bb3a9' : '1px solid transparent',
                padding: '0.5rem 1.2rem',
                cursor: 'pointer',
                borderRadius: '20px',
                fontWeight: vistaActual === 'catalogo' ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
              }}
            >
              Catálogo
            </button>

            <button
              onClick={() => setVista('ventas')}
              style={{
                backgroundColor: vistaActual === 'ventas' ? 'var(--primary)' : 'transparent',
                color: vistaActual === 'ventas' ? '#065f46' : 'var(--text-muted)',
                border: vistaActual === 'ventas' ? '1px solid #5bb3a9' : '1px solid transparent',
                padding: '0.5rem 1.2rem',
                cursor: 'pointer',
                borderRadius: '20px',
                fontWeight: vistaActual === 'ventas' ? 'bold' : 'normal',
                transition: 'all 0.2s ease',
              }}
            >
              Ventas
            </button>

            {esAdmin && (
              <button
                onClick={() => setVista('gestion')}
                style={{
                  backgroundColor: vistaActual === 'gestion' ? 'var(--primary)' : 'transparent',
                  color: vistaActual === 'gestion' ? '#065f46' : 'var(--text-muted)',
                  border: vistaActual === 'gestion' ? '1px solid #5bb3a9' : '1px solid transparent',
                  padding: '0.5rem 1.2rem',
                  cursor: 'pointer',
                  borderRadius: '20px',
                  fontWeight: vistaActual === 'gestion' ? 'bold' : 'normal',
                  transition: 'all 0.2s ease',
                }}
              >
                Gestión
              </button>
            )}

            <button
              onClick={onLogout}
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid transparent',
                padding: '0.5rem 1.2rem',
                cursor: 'pointer',
                borderRadius: '20px',
              }}
            >
              Cerrar sesión
            </button>
          </>
        ) : null}
      </div>
    </nav>
  );
};