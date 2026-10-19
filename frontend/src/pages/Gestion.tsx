import React, { useState, useEffect } from 'react';
import type { Cliente, Categoria } from '../interfaces';
import { obtenerClientesAPI, crearClienteAPI, obtenerCategoriasAPI, crearCategoriaAPI } from '../services/apiService';

interface GestionProps {
  onMostrarMensaje: (msg: string, esError: boolean) => void;
  onSetCargando: (cargando: boolean) => void;
}

export const Gestion: React.FC<GestionProps> = ({ onMostrarMensaje, onSetCargando }) => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);

  const [nombreCliente, setNombreCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');
  const [correoCliente, setCorreoCliente] = useState('');

  const [nombreCategoria, setNombreCategoria] = useState('');
  const [descCategoria, setDescCategoria] = useState('');

  const cargarDatos = async () => {
    onSetCargando(true);
    try {
      const [cliRes, catRes] = await Promise.all([obtenerClientesAPI(), obtenerCategoriasAPI()]);
      setClientes(cliRes);
      setCategorias(catRes);
    } catch (err: any) {
      onMostrarMensaje(err.message, true);
    } finally {
      onSetCargando(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCliente.trim()) {
      onMostrarMensaje('El nombre del cliente es obligatorio.', true);
      return;
    }
    onSetCargando(true);
    try {
      const res = await crearClienteAPI({ nombre: nombreCliente, telefono: telefonoCliente, correo: correoCliente });
      if (res.success) {
        onMostrarMensaje('Cliente registrado exitosamente.', false);
        setNombreCliente('');
        setTelefonoCliente('');
        setCorreoCliente('');
        cargarDatos();
      } else {
        onMostrarMensaje(res.mensaje || 'Error al registrar cliente.', true);
      }
    } catch {
      onMostrarMensaje('Error de red al registrar cliente.', true);
    } finally {
      onSetCargando(false);
    }
  };

  const handleCrearCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreCategoria.trim()) {
      onMostrarMensaje('El nombre de la categoría es obligatorio.', true);
      return;
    }
    onSetCargando(true);
    try {
      const res = await crearCategoriaAPI({ nombre: nombreCategoria, descripcion: descCategoria });
      if (res.success) {
        onMostrarMensaje('Categoría creada exitosamente.', false);
        setNombreCategoria('');
        setDescCategoria('');
        cargarDatos();
      } else {
        onMostrarMensaje(res.mensaje || 'Error al crear categoría.', true);
      }
    } catch {
      onMostrarMensaje('Error de red al crear categoría.', true);
    } finally {
      onSetCargando(false);
    }
  };

  return (
    <div className="fade-in responsive-grid" style={{ padding: '2.5rem 2rem', maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
      
      {/* Sección Clientes */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ color: '#0f766e', marginTop: 0 }}>👥 Gestión de Clientes</h3>
        <form onSubmit={handleCrearCliente} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
          <input 
            type="text" placeholder="Nombre completo *" value={nombreCliente} onChange={e => setNombreCliente(e.target.value)}
            style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
          <input 
            type="text" placeholder="Teléfono" value={telefonoCliente} onChange={e => setTelefonoCliente(e.target.value)}
            style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
          <input 
            type="email" placeholder="Correo electrónico" value={correoCliente} onChange={e => setCorreoCliente(e.target.value)}
            style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
          <button type="submit" style={{ backgroundColor: '#5bb3a9', color: 'white', padding: '0.6rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>
            Registrar Cliente
          </button>
        </form>

        <h4 style={{ color: 'var(--text-main)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>Registrados ({clientes.length})</h4>
        <ul style={{ maxHeight: '140px', overflowY: 'auto', paddingLeft: '1rem', margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {clientes.map(c => (
            <li key={c.id_cliente} style={{ marginBottom: '0.3rem' }}>{c.nombre} <span style={{ fontSize: '0.8rem' }}>({c.telefono || 'Sin tel'})</span></li>
          ))}
        </ul>
      </div>

      {/* Sección Categorías */}
      <div style={{ backgroundColor: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', boxShadow: 'var(--shadow)', border: '1px solid #e2e8f0' }}>
        <h3 style={{ color: '#0f766e', marginTop: 0 }}>🏷️ Gestión de Categorías</h3>
        <form onSubmit={handleCrearCategoria} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginBottom: '1.5rem' }}>
          <input 
            type="text" placeholder="Nombre de categoría *" value={nombreCategoria} onChange={e => setNombreCategoria(e.target.value)}
            style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
          <input 
            type="text" placeholder="Descripción" value={descCategoria} onChange={e => setDescCategoria(e.target.value)}
            style={{ padding: '0.6rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
          <button type="submit" style={{ backgroundColor: '#0f766e', color: 'white', padding: '0.6rem', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }}>
            Crear Categoría
          </button>
        </form>

        <h4 style={{ color: 'var(--text-main)', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.4rem' }}>Existentes ({categorias.length})</h4>
        <ul style={{ maxHeight: '140px', overflowY: 'auto', paddingLeft: '1rem', margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          {categorias.map(cat => (
            <li key={cat.id_categoria} style={{ marginBottom: '0.3rem' }}><b>{cat.nombre}</b></li>
          ))}
        </ul>
      </div>

    </div>
  );
};