import React from 'react';

interface UIFeedbackProps {
  cargando: boolean;
  error: string | null;
  exito: string | null;
}

export const UIFeedback: React.FC<UIFeedbackProps> = ({ cargando, error, exito }) => {
  if (!cargando && !error && !exito) return null;

  return (
    <div style={{ position: 'fixed', bottom: '25px', right: '25px', zIndex: 1000, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {cargando && (
        <div style={{ backgroundColor: '#0f766e', color: 'white', padding: '12px 22px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.9rem' }}>
          <div style={{ width: '16px', height: '16px', border: '2px solid #8de5db', borderTop: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          Procesando operación...
        </div>
      )}
      {error && (
        <div style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #f87171', padding: '12px 20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: '500', fontSize: '0.9rem' }}>
          ⚠️ {error}
        </div>
      )}
      {exito && (
        <div style={{ backgroundColor: '#f0fdf4', color: '#166534', border: '1px solid #4ade80', padding: '12px 20px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontWeight: '500', fontSize: '0.9rem' }}>
          ✅ {exito}
        </div>
      )}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};