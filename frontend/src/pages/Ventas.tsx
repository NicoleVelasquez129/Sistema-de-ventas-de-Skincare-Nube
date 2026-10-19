import React, { useEffect, useState } from 'react';
import type { Producto, Cliente } from '../interfaces';
import { obtenerProductosAPI, obtenerClientesAPI, registrarVentaAPI } from '../services/apiService';

export const Ventas: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [idClienteSeleccionado, setIdClienteSeleccionado] = useState<number>(0);
  const [idProductoSeleccionado, setIdProductoSeleccionado] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [mensaje, setMensaje] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    obtenerProductosAPI().then(setProductos);
    obtenerClientesAPI().then(setClientes);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensaje('');
    setError('');

    if (!idClienteSeleccionado || !idProductoSeleccionado || cantidad <= 0) {
      setError('Por favor seleccione un cliente, un producto y una cantidad válida.');
      return;
    }

    try {
      const ventaData = {
        id_cliente: Number(idClienteSeleccionado),
        id_usuario: 1,
        items: [
          {
            id_producto: Number(idProductoSeleccionado),
            cantidad: Number(cantidad)
          }
        ]
      };

      const resultado = await registrarVentaAPI(ventaData);
      if (resultado.success) {
        setMensaje('¡Venta registrada con éxito y stock actualizado!');
        setCantidad(1);
        obtenerProductosAPI().then(setProductos);
      } else {
        setError(resultado.mensaje || 'Error al registrar la venta');
      }
    } catch {
      setError('Error de conexión con el backend.');
    }
  };

  return (
    <div className="fade-in" style={{ padding: '2.5rem 2rem', maxWidth: '650px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ color: '#0f766e', margin: 0 }}>🛒 Módulo de Ventas</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Registra transacciones de forma segura y descuenta stock automáticamente</p>
      </div>

      {mensaje && <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.9rem' }}>✅ {mensaje}</div>}
      {error && <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '1rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.9rem' }}>⚠️ {error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', backgroundColor: 'var(--bg-card)', padding: '2.5rem', borderRadius: '12px', boxShadow: 'var(--shadow)', border: '1px solid #e2e8f0' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Seleccionar Cliente:</label>
          <select 
            value={idClienteSeleccionado} 
            onChange={(e) => setIdClienteSeleccionado(Number(e.target.value))}
            style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }}
          >
            <option value={0}>-- Elija un cliente --</option>
            {clientes.map(c => (
              <option key={c.id_cliente} value={c.id_cliente}>{c.nombre} ({c.correo || 'Sin correo'})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Seleccionar Producto:</label>
          <select 
            value={idProductoSeleccionado} 
            onChange={(e) => setIdProductoSeleccionado(Number(e.target.value))}
            style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc' }}
          >
            <option value={0}>-- Elija un producto --</option>
            {productos.map(p => (
              <option key={p.id_producto} value={p.id_producto}>{p.nombre} - ${p.precio} (Stock: {p.stock})</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: '600', fontSize: '0.9rem', color: 'var(--text-main)' }}>Cantidad:</label>
          <input 
            type="number" 
            min="1" 
            value={cantidad} 
            onChange={(e) => setCantidad(Number(e.target.value))}
            style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: '#f8fafc', boxSizing: 'border-box' }}
          />
        </div>

        <button 
          type="submit" 
          style={{ backgroundColor: '#5bb3a9', color: 'white', padding: '0.8rem', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'background 0.2s', marginTop: '0.5rem' }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#0f766e'}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#5bb3a9'}
        >
          Procesar Venta
        </button>
      </form>
    </div>
  );
};