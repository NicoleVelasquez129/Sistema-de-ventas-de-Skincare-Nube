import React, { useMemo } from 'react';

const N = 25;
const COLOR = '#1c1917';

// QR de muestra (no es un código real): el dibujo depende del número de pedido
export const QrPagoFalso: React.FC<{ semilla: number }> = ({ semilla }) => {
  const modulos = useMemo(() => {
    let s = (semilla * 9301 + 49297) % 233280;
    const lista: [number, number][] = [];
    for (let f = 0; f < N; f++) {
      for (let c = 0; c < N; c++) {
        s = (s * 9301 + 49297) % 233280;
        const enEsquina = (f < 8 && c < 8) || (f < 8 && c >= N - 8) || (f >= N - 8 && c < 8);
        if (!enEsquina && s / 233280 > 0.5) lista.push([f, c]);
      }
    }
    return lista;
  }, [semilla]);

  const esquina = (x: number, y: number) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width="7" height="7" fill={COLOR} />
      <rect x={x + 1} y={y + 1} width="5" height="5" fill="#fff" />
      <rect x={x + 2} y={y + 2} width="3" height="3" fill={COLOR} />
    </g>
  );

  return (
    <svg
      viewBox="-1 -1 27 27"
      className="h-44 w-44 rounded-lg border border-stone-200 bg-white"
      role="img"
      aria-label="Código QR de pago de muestra"
      shapeRendering="crispEdges"
    >
      <rect x="-1" y="-1" width="27" height="27" fill="#fff" />
      {modulos.map(([f, c]) => (
        <rect key={`${f}-${c}`} x={c} y={f} width="1" height="1" fill={COLOR} />
      ))}
      {esquina(0, 0)}
      {esquina(N - 7, 0)}
      {esquina(0, N - 7)}
    </svg>
  );
};