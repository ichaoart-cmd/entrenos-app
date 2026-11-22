import { useState } from 'preact/hooks';
import type { Punto } from '../domain/progreso';

import { AMARILLO, FONDO, MONO, REJILLA, ROSA, TEXTO, TINTA } from './coloresGrafica';

/** 1RM estimado = área rosa plana con línea negra gruesa encima; serie top = puntos amarillos con contorno.
 * Doble codificación (área vs punto + leyenda); rosa/amarillo: CVD ΔE 16,8, normal 19,7. */
export const COLOR_E1RM = ROSA;
export const COLOR_TOP = AMARILLO;

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const dia = (f: string) => Date.parse(f) / 864e5;
const kg = (n: number) => String(Math.round(n * 2) / 2).replace('.', ',');
const fechaCorta = (f: string) => `${Number(f.slice(8))} ${MESES[Number(f.slice(5, 7)) - 1]} ${f.slice(2, 4)}`;

function pasoBonito(rango: number): number {
  const bruto = rango / 4, mag = 10 ** Math.floor(Math.log10(bruto));
  return [1, 2, 2.5, 5, 10].map((m) => m * mag).find((p) => p >= bruto) ?? 10 * mag;
}

export function Grafica({ puntos, nombre }: { puntos: Punto[]; nombre: string }) {
  const [activo, setActivo] = useState<number | null>(null);
  const W = 340, H = 220, izq = 34, der = 14, arriba = 20, abajo = 28;
  if (puntos.length < 2) {
    return <p class='suave'>Con un registro más aparecerá aquí la gráfica de {nombre}.</p>;
  }
  const valores = puntos.flatMap((p) => [p.kg, p.e1rm]);
  const paso = pasoBonito(Math.max(...valores) - Math.min(...valores) || 10);
  const yMin = Math.floor(Math.min(...valores) / paso) * paso, yMax = Math.ceil(Math.max(...valores) / paso) * paso;
  const t0 = dia(puntos[0].fecha), t1 = dia(puntos[puntos.length - 1].fecha) || t0 + 1;
  const X = (f: string) => izq + ((dia(f) - t0) / Math.max(1, t1 - t0)) * (W - izq - der);
  const Y = (v: number) => arriba + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - arriba - abajo);
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += paso) ticks.push(v);
  // Marcas de tiempo: primer día de cada año o de algunos meses según el tramo.
  const años = (t1 - t0) / 365;
  const marcas: string[] = [];
  const salto = años > 2 ? 12 : años > 1 ? 6 : años > 0.4 ? 3 : 1;
  // Alinea las marcas a meses múltiplos del salto contando desde enero (enero, julio… o solo enero).
  const d = new Date(puntos[0].fecha.slice(0, 7) + '-01T00:00:00Z');
  while (d.getUTCMonth() % salto) d.setUTCMonth(d.getUTCMonth() + 1);
  while (iso(d) <= puntos[puntos.length - 1].fecha) {
    if (iso(d) >= puntos[0].fecha) marcas.push(iso(d));
    d.setUTCMonth(d.getUTCMonth() + salto);
  }
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'}${X(p.fecha).toFixed(1)} ${Y(p.e1rm).toFixed(1)}`).join(' ');
  const area = `${linea} L${X(puntos[puntos.length - 1].fecha).toFixed(1)} ${Y(yMin)} L${X(puntos[0].fecha).toFixed(1)} ${Y(yMin)} Z`;
  const mover = (e: PointerEvent) => {
    const svg = e.currentTarget as SVGSVGElement, r = svg.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    let mejor = 0;
    puntos.forEach((p, i) => { if (Math.abs(X(p.fecha) - x) < Math.abs(X(puntos[mejor].fecha) - x)) mejor = i; });
    setActivo(mejor);
  };
  const a = activo != null ? puntos[activo] : null;
  const ultimo = puntos[puntos.length - 1];

  return (
    <figure class='grafica'>
      <div class='leyenda'>
        <span><i class='a' style={{ background: COLOR_E1RM }} />1RM estimado</span>
        <span><i class='p' style={{ background: COLOR_TOP }} />Serie top</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role='img' aria-label={`${nombre}: 1RM estimado y serie top por sesión`}
        onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setActivo(null)} style={{ touchAction: 'pan-y' }}>
        {ticks.map((v) => (
          <g>
            <line x1={izq} x2={W - der} y1={Y(v)} y2={Y(v)} stroke={REJILLA} stroke-dasharray='3 4' />
            <text x={izq - 6} y={Y(v) + 3.5} text-anchor='end' font-size='10' font-family={MONO} fill={TEXTO}>{v}</text>
          </g>
        ))}
        {marcas.map((m) => (
          <text x={X(m)} y={H - 8} text-anchor='middle' font-size='10' font-family={MONO} fill={TEXTO}>
            {salto >= 12 ? m.slice(0, 4) : `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}`}
          </text>
        ))}
        <path d={area} fill={COLOR_E1RM} />
        {ticks.slice(1).map((v) => <line x1={izq} x2={W - der} y1={Y(v)} y2={Y(v)} stroke={TINTA} stroke-opacity='0.12' />)}
        <line x1={izq} x2={W - der} y1={Y(yMin)} y2={Y(yMin)} stroke={TINTA} stroke-width='2.5' />
        {a && <line x1={X(a.fecha)} x2={X(a.fecha)} y1={arriba} y2={H - abajo} stroke={TINTA} stroke-width='1.5' stroke-dasharray='4 3' />}
        <path d={linea} fill='none' stroke={TINTA} stroke-width='3' stroke-linejoin='round' stroke-linecap='round' />
        {puntos.map((p) => <circle cx={X(p.fecha)} cy={Y(p.kg)} r='5' fill={COLOR_TOP} stroke={TINTA} stroke-width='2' />)}
        {!a && <Etiqueta x={X(ultimo.fecha)} y={Y(ultimo.e1rm) - 18} texto={kg(ultimo.e1rm)} max={W} />}
        {a && <circle cx={X(a.fecha)} cy={Y(a.e1rm)} r='6.5' fill={FONDO} stroke={TINTA} stroke-width='3' />}
        {a && <Etiqueta x={X(a.fecha)} y={Y(a.e1rm) - 20} texto={kg(a.e1rm)} max={W} />}
      </svg>
      <figcaption class='detalle' aria-live='polite'>
        {a ? <><b>{fechaCorta(a.fecha)}</b> · {a.reps} × {kg(a.kg)} kg · 1RM est. {kg(a.e1rm)} kg</>
          : <span class='suave'>Toca la gráfica para ver cada sesión</span>}
      </figcaption>
    </figure>
  );
}

function iso(d: Date) { return d.toISOString().slice(0, 10); }

/** Pastilla negra con la cifra, como una pegatina; no se sale del gráfico. */
export function Etiqueta({ x, y, texto, max, fondo = TINTA, color = FONDO }: { x: number; y: number; texto: string; max: number; fondo?: string; color?: string }) {
  const ancho = texto.length * 7 + 14, cx = Math.min(Math.max(x, ancho / 2 + 2), max - ancho / 2 - 2), cy = Math.max(y, 10);
  return (
    <g>
      <rect x={cx - ancho / 2} y={cy - 9} width={ancho} height='18' rx='5' fill={fondo} />
      <text x={cx} y={cy + 4} text-anchor='middle' font-size='11' font-weight='700' font-family={MONO} fill={color}>{texto}</text>
    </g>
  );
}
