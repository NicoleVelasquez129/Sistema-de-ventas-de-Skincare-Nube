import React, { useEffect, useState } from 'react';
import type { Producto } from '../interfaces';
import { obtenerProductosAPI } from '../services/apiService';

export const Catalogo: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');

  useEffect(() => {
    obtenerProductosAPI().then((data) => {
      setProductos(data);
      setCargando(false);
    });
  }, []);

  const productosFiltrados = productos.filter(p => 
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (cargando) return <div style={{ textAlign: 'center', marginTop: '4rem', color: '#0f766e', fontWeight: '500' }}>Cargando catálogo de Skincare...</div>;

  return (
    <div className="fade-in" style={{ padding: '2.5rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#0f766e' }}>✨ Catálogo de Productos</h2>
          <p style={{ margin: '0.2rem 0 0 0', color: 'var(--text-muted)', fontSize: '0.95rem' }}>Explora las soluciones ideales para el cuidado de tu piel</p>
        </div>
        
        <input 
          type="text" 
          placeholder="Buscar producto..." 
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          style={{
            padding: '0.6rem 1rem',
            borderRadius: '20px',
            border: '1px solid #cbd5e1',
            outline: 'none',
            width: '240px',
            backgroundColor: '#ffffff',
            transition: 'border 0.2s'
          }}
        />
      </div>

      {productosFiltrados.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: 'var(--shadow)' }}>
          <p style={{ color: 'var(--text-muted)' }}>No se encontraron productos registrados o el servidor backend no está activo.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {productosFiltrados.map((prod) => (
            <div 
              key={prod.id_producto} 
              style={{ 
                backgroundColor: 'var(--bg-card)', 
                border: '1px solid #e2e8f0', 
                borderRadius: '12px', 
                padding: '1.5rem', 
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(141, 229, 219, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
              }}
            >
              <div>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#e6fffa', color: '#047857', padding: '0.2rem 0.6rem', borderRadius: '10px', fontWeight: 'bold' }}>
                  {prod.Categoria?.nombre || 'Skincare'}
                </span>
                <h3 style={{ margin: '0.8rem 0 0.4rem 0', color: 'var(--text-main)', fontSize: '1.1rem' }}>{prod.nombre}</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: '1.4', minHeight: '36px' }}>{prod.descripcion || 'Sin descripción detallada.'}</p>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 'bold', color: '#0f766e', fontSize: '1.2rem' }}>${Number(prod.precio).toFixed(2)}</span>
                <span style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '6px', backgroundColor: prod.stock <= prod.stock_minimo ? '#fee2e2' : '#f0fdf4', color: prod.stock <= prod.stock_minimo ? '#991b1b' : '#166534', fontWeight: 'bold' }}>
                  Stock: {prod.stock}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};