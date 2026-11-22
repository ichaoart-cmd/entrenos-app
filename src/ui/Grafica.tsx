import { useState } from 'preact/hooks';
import type { Punto } from '../domain/progreso';

/** Colores validados para la gráfica (dataviz: banda de luminosidad, croma y contraste OK; CVD 7,7 → con codificación doble: línea vs puntos + leyenda). */
export const COLOR_E1RM = '#2f7d4f';
export const COLOR_TOP = '#c4791d';

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
  const W = 340, H = 210, izq = 34, der = 12, arriba = 14, abajo = 26;
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
        <span><i class='l' style={{ background: COLOR_E1RM }} />1RM estimado</span>
        <span><i class='p' style={{ background: COLOR_TOP }} />Serie top</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} role='img' aria-label={`${nombre}: 1RM estimado y serie top por sesión`}
        onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setActivo(null)} style={{ touchAction: 'pan-y' }}>
        {ticks.map((v) => (
          <g>
            <line x1={izq} x2={W - der} y1={Y(v)} y2={Y(v)} stroke='#e3dccf' stroke-width='1' />
            <text x={izq - 6} y={Y(v) + 3.5} text-anchor='end' font-size='10' fill='#6f7266'>{v}</text>
          </g>
        ))}
        {marcas.map((m) => (
          <text x={X(m)} y={H - 8} text-anchor='middle' font-size='10' fill='#6f7266'>
            {salto >= 12 ? m.slice(0, 4) : `${MESES[Number(m.slice(5, 7)) - 1]} ${m.slice(2, 4)}`}
          </text>
        ))}
        <path d={linea} fill='none' stroke={COLOR_E1RM} stroke-width='2' stroke-linejoin='round' stroke-linecap='round' />
        {puntos.map((p) => <circle cx={X(p.fecha)} cy={Y(p.kg)} r='4' fill={COLOR_TOP} stroke='#f8f4ec' stroke-width='2' />)}
        <text x={X(ultimo.fecha) - 6} y={Y(ultimo.e1rm) - 12} text-anchor='end' font-size='11' font-weight='700' fill='#1e241d'>{kg(ultimo.e1rm)}</text>
        {a && <line x1={X(a.fecha)} x2={X(a.fecha)} y1={arriba} y2={H - abajo} stroke='#6f7266' stroke-width='1' />}
        {a && <circle cx={X(a.fecha)} cy={Y(a.e1rm)} r='4.5' fill={COLOR_E1RM} stroke='#f8f4ec' stroke-width='2' />}
      </svg>
      <figcaption class='detalle' aria-live='polite'>
        {a ? <><b>{fechaCorta(a.fecha)}</b> · {a.reps} × {kg(a.kg)} kg · 1RM est. {kg(a.e1rm)} kg</>
          : <span class='suave'>Toca la gráfica para ver cada sesión</span>}
      </figcaption>
    </figure>
  );
}

function iso(d: Date) { return d.toISOString().slice(0, 10); }
