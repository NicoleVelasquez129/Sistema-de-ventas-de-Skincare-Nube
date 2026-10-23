import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Catalogo } from './pages/Catalogo';
import { Ventas } from './pages/Ventas';
import { Gestion } from './pages/Gestion';
import { Login } from './pages/Login';
import { UIFeedback } from './components/UIFeedback';
import { obtenerUsuarioGuardado, cerrarSesion } from './services/authService';
import type { UsuarioSesion } from './services/authService';

function App() {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(obtenerUsuarioGuardado());
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const esAdmin = usuario?.rol === 'administrador';

  const salir = () => {
    cerrarSesion();
    setUsuario(null);
  };

  const mostrarMensaje = (mensaje: string, esError: boolean) => {
    if (esError) {
      setError(mensaje);
      setExito(null);
    } else {
      setExito(mensaje);
      setError(null);
    }
    setTimeout(() => {
      setError(null);
      setExito(null);
    }, 4000);
  };

  return (
    <BrowserRouter>
      <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f1f5f9', position: 'relative' }}>
        <Navbar usuario={usuario} onLogout={salir} />

        <main>
          <Routes>
            <Route path="/" element={<Catalogo />} />
            <Route path="/login" element={<Login onLogin={setUsuario} />} />
            <Route path="/ventas" element={esAdmin ? <Ventas /> : <Navigate to="/login" replace />} />
            <Route
              path="/gestion"
              element={esAdmin ? <Gestion onMostrarMensaje={mostrarMensaje} onSetCargando={setCargando} /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <UIFeedback cargando={cargando} error={error} exito={exito} />
      </div>
    </BrowserRouter>
  );
}

export default App;