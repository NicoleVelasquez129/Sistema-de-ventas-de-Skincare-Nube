// frontend/src/components/Navbar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { UsuarioSesion } from '../services/authService';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  usuario: UsuarioSesion | null;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart, usuario, onLogout }) => {
  const esCatalogo = useLocation().pathname === '/';

  return (
    <header className="sticky top-0 z-40 bg-white shadow-sm border-b border-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Logo y Nombre */}
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm" style={{ backgroundColor: '#68c3b7' }}>
            N
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-800">Skincare Nube</span>
            <p className="text-xs text-slate-500 font-medium">Catálogo Oficial</p>
          </div>
        </Link>

        {/* Acciones de Navegación y Canastita */}
        <div className="flex items-center space-x-4">
          {usuario?.rol === 'administrador' && (
            <>
              <Link to="/ventas" className="text-sm font-medium text-slate-600 hover:text-slate-900">Ventas</Link>
              <Link to="/gestion" className="text-sm font-medium text-slate-600 hover:text-slate-900">Gestión</Link>
            </>
          )}
          {usuario ? (
            <button onClick={onLogout} className="text-sm font-medium text-slate-600 hover:text-slate-900">Salir</button>
          ) : (
            <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-slate-900">Iniciar sesión</Link>
          )}
          {esCatalogo && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center space-x-2 px-4 py-2.5 rounded-xl text-white font-medium shadow-sm transition-transform active:scale-95"
              style={{ backgroundColor: '#68c3b7' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              <span className="hidden sm:inline">Canasta</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>

      </div>
    </header>
  );
};