import React, { useEffect, useState } from 'react';
import type { Producto, Cliente, Categoria } from '../interfaces';
import { obtenerProductosAPI, obtenerClientesAPI, obtenerCategoriasAPI, registrarVentaAPI, actualizarProductoAPI } from '../services/apiService';

const ImagenProducto: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [fallo, setFallo] = useState(false);
  const base = { width: '100%', height: '190px' };

  if (!src || fallo) {
    return (
      <div style={{ ...base, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', backgroundColor: 'var(--primary-light)' }}>
        ☁️
      </div>
    );
  }
  return <img src={src} alt={alt} onError={() => setFallo(true)} style={{ ...base, objectFit: 'cover', display: 'block' }} />;
};

export const Catalogo: React.FC = () => {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [busqueda, setBusqueda] = useState<string>('');

  const [seleccionado, setSeleccionado] = useState<Producto | null>(null);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [idCliente, setIdCliente] = useState<number>(0);
  const [cantidad, setCantidad] = useState<number>(1);
  const [mensaje, setMensaje] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [procesando, setProcesando] = useState<boolean>(false);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [editando, setEditando] = useState<boolean>(false);
  const [guardando, setGuardando] = useState<boolean>(false);
  const [form, setForm] = useState({
    nombre: '', descripcion: '', imagen: '', precio: '', stock: '', stock_minimo: '', id_categoria: 0, activo: true
  });

  const iniciarEdicion = () => {
    if (!seleccionado) return;
    setForm({
      nombre: seleccionado.nombre,
      descripcion: seleccionado.descripcion || '',
      imagen: seleccionado.imagen || '',
      precio: String(seleccionado.precio),
      stock: String(seleccionado.stock),
      stock_minimo: String(seleccionado.stock_minimo),
      id_categoria: seleccionado.id_categoria || 0,
      activo: seleccionado.activo
    });
    setMensaje('');
    setError('');
    setEditando(true);
  };

  const guardarEdicion = async () => {
    if (!seleccionado) return;
    setMensaje('');
    setError('');

    const precio = Number(form.precio);
    const stock = Number(form.stock);
    const stockMinimo = Number(form.stock_minimo || 0);

    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return; }
    if (!Number.isFinite(precio) || precio < 0) { setError('Ingrese un precio válido.'); return; }
    if (!Number.isInteger(stock) || stock < 0) { setError('Ingrese un stock entero válido.'); return; }
    if (!Number.isInteger(stockMinimo) || stockMinimo < 0) { setError('Ingrese un stock mínimo entero válido.'); return; }
    if (!form.id_categoria) { setError('Seleccione una categoría.'); return; }

    setGuardando(true);
    try {
      const resultado = await actualizarProductoAPI(seleccionado.id_producto, {
        nombre: form.nombre.trim(),
        descripcion: form.descripcion,
        imagen: form.imagen.trim(),
        precio,
        stock,
        stock_minimo: stockMinimo,
        id_categoria: form.id_categoria,
        activo: form.activo
      });
      if (resultado.success) {
        const data = await obtenerProductosAPI(true);
        setProductos(data);
        setSeleccionado(data.find(p => p.id_producto === seleccionado.id_producto) || null);
        setEditando(false);
        setMensaje('Producto actualizado correctamente.');
      } else {
        setError(resultado.error || resultado.mensaje || 'No se pudo actualizar el producto.');
      }
    } catch {
      setError('Error de conexión con el backend.');
    } finally {
      setGuardando(false);
    }
  };

  const abrirDetalle = (prod: Producto) => {
    setSeleccionado(prod);
    setIdCliente(0);
    setCantidad(1);
    setMensaje('');
    setError('');
  };

  const cerrarDetalle = () => {
    setSeleccionado(null);
    setEditando(false);
  };

  const comprar = async () => {
    if (!seleccionado) return;
    setMensaje('');
    setError('');

    if (!idCliente) { setError('Seleccione un cliente.'); return; }
    if (cantidad <= 0) { setError('La cantidad debe ser mayor a 0.'); return; }
    if (cantidad > seleccionado.stock) { setError(`Solo hay ${seleccionado.stock} unidades disponibles.`); return; }

    setProcesando(true);
    try {
      const resultado = await registrarVentaAPI({
        id_cliente: idCliente,
        id_usuario: 1,
        items: [{ id_producto: seleccionado.id_producto, cantidad }]
      });
      if (resultado.success) {
        setMensaje('¡Venta registrada y stock actualizado!');
        setCantidad(1);
        const data = await obtenerProductosAPI();
        setProductos(data);
        setSeleccionado(data.find(p => p.id_producto === seleccionado.id_producto) || null);
      } else {
        setError(resultado.error || resultado.mensaje || 'Error al registrar la venta');
      }
    } catch {
      setError('Error de conexión con el backend.');
    } finally {
      setProcesando(false);
    }
  };

  useEffect(() => {
    obtenerProductosAPI(true).then((data) => {
      setProductos(data);
      setCargando(false);
    });
    obtenerClientesAPI().then(setClientes).catch(() => {});
    obtenerCategoriasAPI().then(setCategorias).catch(() => {});
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
                cursor: 'pointer',
                overflow: 'hidden',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
              onClick={() => abrirDetalle(prod)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(141, 229, 219, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
              }}
            >
              <ImagenProducto src={prod.imagen} alt={prod.nombre} />

              <div style={{ padding: '1.2rem 1.5rem 1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', flex: 1 }}>
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
            </div>
          ))}
        </div>
      )}
            {seleccionado && (
        <div
          onClick={cerrarDetalle}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', zIndex: 200 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ backgroundColor: 'var(--bg-card)', borderRadius: '14px', width: '100%', maxWidth: '460px', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 40px rgba(0,0,0,0.25)' }}
          >
            {editando ? (
              <div style={{ padding: '1.5rem' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#0f766e' }}>✏️ Editar producto</h3>
                {error && <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '0.7rem', marginBottom: '0.8rem', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.9rem' }}>⚠️ {error}</div>}

                <ImagenProducto src={form.imagen} alt={form.nombre} />
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', margin: '0.8rem 0 0.3rem' }}>Nombre</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', margin: '0.8rem 0 0.3rem' }}>URL de la imagen</label>
                <input
                  type="text"
                  value={form.imagen}
                  onChange={(e) => setForm({ ...form, imagen: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', margin: '0.8rem 0 0.3rem' }}>Descripción</label>
                <textarea
                  rows={3}
                  value={form.descripcion}
                  onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', fontFamily: 'inherit' }}
                />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.6rem', margin: '0.8rem 0' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                    Precio
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={form.precio}
                      onChange={(e) => setForm({ ...form, precio: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </label>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                    Stock
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </label>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600' }}>
                    Stock mínimo
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={form.stock_minimo}
                      onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                    />
                  </label>
                </div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', marginBottom: '0.3rem' }}>Categoría</label>
                <select
                  value={form.id_categoria}
                  onChange={(e) => setForm({ ...form, id_categoria: Number(e.target.value) })}
                  style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}
                >
                  <option value={0}>-- Elija una categoría --</option>
                  {categorias.map(c => (
                    <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>
                  ))}
                </select>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: '1rem 0 1.2rem', fontWeight: '600', fontSize: '0.9rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.activo}
                    onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                  />
                  Producto activo
                </label>
                <div style={{ display: 'flex', gap: '0.6rem' }}>
                  <button
                    onClick={guardarEdicion}
                    disabled={guardando}
                    style={{ flex: 1, padding: '0.8rem', backgroundColor: 'var(--primary)', color: '#065f46', border: '1px solid #5bb3a9', borderRadius: '8px', fontWeight: 'bold', cursor: guardando ? 'wait' : 'pointer' }}
                  >
                    {guardando ? 'Guardando...' : '💾 Guardar cambios'}
                  </button>
                  <button
                    onClick={() => { setEditando(false); setError(''); }}
                    disabled={guardando}
                    style={{ padding: '0.8rem 1.2rem', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
            <>
            <ImagenProducto src={seleccionado.imagen} alt={seleccionado.nombre} />
            <div style={{ padding: '1.5rem' }}>
              <span style={{ fontSize: '0.75rem', backgroundColor: '#e6fffa', color: '#047857', padding: '0.2rem 0.6rem', borderRadius: '10px', fontWeight: 'bold' }}>
                {seleccionado.Categoria?.nombre || 'Skincare'}
              </span>
              <h3 style={{ margin: '0.8rem 0 0.4rem 0', color: 'var(--text-main)' }}>{seleccionado.nombre}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: '1.5' }}>{seleccionado.descripcion || 'Sin descripción detallada.'}</p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '1rem 0' }}>
                <span style={{ fontWeight: 'bold', color: '#0f766e', fontSize: '1.4rem' }}>${Number(seleccionado.precio).toFixed(2)}</span>
                <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: seleccionado.stock <= seleccionado.stock_minimo ? '#991b1b' : '#166534' }}>
                  Stock: {seleccionado.stock}
                </span>
              </div>

              {mensaje && <div style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '0.7rem', marginBottom: '0.8rem', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.9rem' }}>✅ {mensaje}</div>}
              {error && <div style={{ backgroundColor: '#fef2f2', color: '#991b1b', padding: '0.7rem', marginBottom: '0.8rem', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.9rem' }}>⚠️ {error}</div>}

              <select
                value={idCliente}
                onChange={(e) => setIdCliente(Number(e.target.value))}
                style={{ width: '100%', padding: '0.7rem', borderRadius: '8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', marginBottom: '0.8rem' }}
              >
                <option value={0}>-- Elija un cliente --</option>
                {clientes.map(c => (
                  <option key={c.id_cliente} value={c.id_cliente}>{c.nombre}</option>
                ))}
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '1rem' }}>
                <label style={{ fontWeight: '600', fontSize: '0.9rem' }}>Cantidad:</label>
                <input
                  type="number"
                  min={1}
                  max={seleccionado.stock}
                  value={cantidad}
                  onChange={(e) => setCantidad(Number(e.target.value))}
                  style={{ width: '80px', padding: '0.5rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}
                />
                <span style={{ marginLeft: 'auto', fontWeight: 'bold', color: '#0f766e' }}>
                  Total: ${(Number(seleccionado.precio) * (cantidad || 0)).toFixed(2)}
                </span>
              </div>

              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={iniciarEdicion}
                  style={{ padding: '0.8rem 1rem', backgroundColor: 'transparent', color: '#0f766e', border: '1px solid #5bb3a9', borderRadius: '8px', cursor: 'pointer' }}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={comprar}
                  disabled={procesando || seleccionado.stock === 0}
                  style={{ flex: 1, padding: '0.8rem', backgroundColor: 'var(--primary)', color: '#065f46', border: '1px solid #5bb3a9', borderRadius: '8px', fontWeight: 'bold', cursor: seleccionado.stock === 0 ? 'not-allowed' : 'pointer', opacity: seleccionado.stock === 0 ? 0.5 : 1 }}
                >
                  {procesando ? 'Procesando...' : seleccionado.stock === 0 ? 'Sin stock' : '🛒 Comprar'}
                </button>
                <button
                  onClick={cerrarDetalle}
                  style={{ padding: '0.8rem 1.2rem', backgroundColor: 'transparent', color: 'var(--text-muted)', border: '1px solid #cbd5e1', borderRadius: '8px', cursor: 'pointer' }}
                >
                  Cerrar
                </button>
              </div>
            </div>
            </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};