import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { Catalogo } from './pages/Catalogo';
import { Ventas } from './pages/Ventas';
import { Gestion } from './pages/Gestion';
import { UIFeedback } from './components/UIFeedback';

function App() {
  const [vistaActual, setVistaActual] = useState<'catalogo' | 'ventas' | 'gestion'>('catalogo');
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

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
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh', backgroundColor: '#f1f5f9', position: 'relative' }}>
      <Navbar setVista={setVistaActual} vistaActual={vistaActual} />
      
      <main>
        {vistaActual === 'catalogo' && <Catalogo />}
        {vistaActual === 'ventas' && <Ventas />}
        {vistaActual === 'gestion' && <Gestion onMostrarMensaje={mostrarMensaje} onSetCargando={setCargando} />}
      </main>

      <UIFeedback cargando={cargando} error={error} exito={exito} />
    </div>
  );
}

export default App;