import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Catalogo } from './pages/Catalogo';
import { Ventas } from './pages/Ventas';
import { Gestion } from './pages/Gestion';
import { Login } from './pages/Login';
import { RestablecerContrasena } from './pages/RestablecerContrasena';
import { UIFeedback } from './components/UIFeedback';
import { Canastita } from './components/Canastita.tsx';
import { obtenerUsuarioGuardado, cerrarSesion } from './services/authService';
import type { UsuarioSesion } from './services/authService';
import type { CartItem, Producto } from './interfaces';

function App() {
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(obtenerUsuarioGuardado());
  const [cargando, setCargando] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);
  const [carrito, setCarrito] = useState<CartItem[]>([]);
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const esAdmin = usuario?.rol === 'administrador';
  const subtotal = carrito.reduce((total, item) => total + Number(item.producto.precio) * item.cantidad, 0);
  const cantidadEnCarrito = carrito.reduce((total, item) => total + item.cantidad, 0);

  const agregarAlCarrito = (producto: Producto, cantidad: number) => {
    if (producto.stock <= 0) return;
    setCarrito(actual => {
      const existente = actual.find(item => item.producto.id_producto === producto.id_producto);
      if (existente) {
        return actual.map(item => item.producto.id_producto === producto.id_producto
          ? { ...item, cantidad: Math.min(producto.stock, item.cantidad + cantidad) }
          : item);
      }
      return [...actual, { producto, cantidad: Math.min(producto.stock, cantidad) }];
    });
  };

  const cambiarCantidad = (idProducto: number, delta: number) => {
    setCarrito(actual => actual.map(item => {
      if (item.producto.id_producto !== idProducto) return item;
      const nueva = Math.min(item.producto.stock, Math.max(1, item.cantidad + delta));
      return { ...item, cantidad: nueva };
    }));
  };

  const quitarDelCarrito = (idProducto: number) => {
    setCarrito(actual => actual.filter(item => item.producto.id_producto !== idProducto));
  };

  const iniciarSesion = (sesion: UsuarioSesion) => {
    setUsuario(sesion);
    const carritoPendiente = localStorage.getItem('carrito_pendiente');
    if (!carritoPendiente) return;

    try {
      const items: unknown = JSON.parse(carritoPendiente);
      if (Array.isArray(items)) {
        const itemsValidos = items.filter((item): item is CartItem =>
          item &&
          typeof item === 'object' &&
          'producto' in item &&
          'cantidad' in item &&
          item.producto &&
          Number.isInteger(item.producto.id_producto) &&
          Number.isInteger(item.cantidad) &&
          item.cantidad > 0
        );
        setCarrito(itemsValidos);
      }
      localStorage.removeItem('carrito_pendiente');
    } catch {
      localStorage.removeItem('carrito_pendiente');
    }
  };

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
        <Navbar
          usuario={usuario}
          onLogout={salir}
          cartCount={cantidadEnCarrito}
          onOpenCart={() => setCarritoAbierto(true)}
        />

        <main>
          <Routes>
            <Route path="/" element={<Catalogo onAddToCart={agregarAlCarrito} />} />
            <Route path="/login" element={<Login onLogin={iniciarSesion} />} />
            <Route path="/restablecer" element={<RestablecerContrasena />} />
            <Route path="/ventas" element={esAdmin ? <Ventas /> : <Navigate to="/login" replace />} />
            <Route
              path="/gestion"
              element={esAdmin ? <Gestion onMostrarMensaje={mostrarMensaje} onSetCargando={setCargando} /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        <Canastita
          abierto={carritoAbierto}
          onCerrar={() => setCarritoAbierto(false)}
          items={carrito}
          subtotal={subtotal}
          onCambiarCantidad={cambiarCantidad}
          onQuitar={quitarDelCarrito}
          onVentaCompletada={() => setCarrito([])}
        />

        <UIFeedback cargando={cargando} error={error} exito={exito} />
      </div>
    </BrowserRouter>
  );
}

export default App;