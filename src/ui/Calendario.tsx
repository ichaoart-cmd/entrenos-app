import { useState } from 'preact/hooks';
import type { Sesion } from '../domain/types';
import { rachaSemanas, semanasDelMes, sesionesPorDia } from '../domain/calendario';
import { COLOR_METCON, colorDe } from './iconos';
import { nombreEjercicio } from './formato';
import { hoy } from './Registrar';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function etiquetaDia(d: string, ses: Sesion[]): string {
  const n = String(Number(d.slice(8)));
  if (!ses.length) return n;
  const cosas = ses.flatMap((s) => [...s.fuerza.map((f) => nombreEjercicio(f.ejercicio)), ...(s.metcon ? ['Metcon'] : [])]);
  return `${n} · ${cosas.length ? cosas.join(', ') : 'entreno'}`;
}

export function Calendario({ sesiones, minSemana }: { sesiones: Sesion[]; minSemana: number }) {
  const h = hoy();
  const [ym, setYm] = useState({ a: Number(h.slice(0, 4)), m: Number(h.slice(5, 7)) });
  const porDia = sesionesPorDia(sesiones);
  const prefijo = `${ym.a}-${String(ym.m).padStart(2, '0')}`;
  const delMes = [...porDia.keys()].filter((d) => d.startsWith(prefijo)).length;
  const racha = rachaSemanas([...porDia.entries()].flatMap(([d, s]) => s.map(() => d)), minSemana, h);
  const mover = (delta: number) => setYm(({ a, m }) => { const t = a * 12 + (m - 1) + delta; return { a: Math.floor(t / 12), m: (t % 12) + 1 }; });

  return (
    <section class='tarjeta calendario'>
      <div class='cal-cabecera'>
        <button type='button' aria-label='Mes anterior' onClick={() => mover(-1)}>‹</button>
        <strong>{MESES[ym.m - 1]} {ym.a}</strong>
        <button type='button' aria-label='Mes siguiente' onClick={() => mover(1)}>›</button>
      </div>
      <div class='cal-resumen'>
        <span><b>{delMes}</b> {delMes === 1 ? 'sesión' : 'sesiones'} este mes</span>
        <span>Racha: <b>{racha}</b> {racha === 1 ? 'semana' : 'semanas'} ({minSemana}+/sem)</span>
      </div>
      <div class='cal-rejilla'>
        {DIAS.map((d) => <span class='cal-dia-nombre'>{d}</span>)}
        {semanasDelMes(ym.a, ym.m).flat().map((d) => {
          if (!d) return <span />;
          const ses = porDia.get(d) ?? [];
          const href = ses.length ? `#/registrar?id=${encodeURIComponent(ses[0].id)}` : `#/registrar?fecha=${d}`;
          const colores = ses.flatMap((s) => [...s.fuerza.map((f) => colorDe(f.ejercicio)), ...(s.metcon ? [COLOR_METCON] : [])]);
          return (
            <a href={href} aria-label={etiquetaDia(d, ses)} class={`cal-dia${ses.length ? ' entrenado' : ''}${d === h ? ' hoy' : ''}${d > h ? ' futuro' : ''}`}
              style={colores.length ? { background: `${colores[0]}33`, borderColor: colores[0] } : undefined}>
              <span>{Number(d.slice(8))}</span>
              {colores.length > 0 && <span class='puntos'>{colores.slice(0, 3).map((c) => <i style={{ background: c }} />)}</span>}
            </a>
          );
        })}
      </div>
    </section>
  );
}
