import { useState } from 'preact/hooks';
import { estado } from '../store/estado';
import type { Carrera } from '../domain/types';
import { DISTANCIAS, formatearRitmo, formatearTiempo, kmPorSemana, mejoresTiempos, prediccion, ritmoSegKm } from '../domain/carrera';
import { Etiqueta } from './Grafica';
import { AMARILLO, CIELO, MENTA, MONO, REJILLA, TEXTO, TINTA } from './coloresGrafica';
import { IconoEjercicio } from './iconos';
import { fechaLarga, resumenCarrera } from './formato';
import { hoy } from './Registrar';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const coma = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const corta = (f: string) => `${Number(f.slice(8))} ${MESES[Number(f.slice(5, 7)) - 1]}`;
const vivas = () => estado.datos.value.carreras.filter((c) => !c.borrado);

export function TarjetaCarrera() {
  const cs = vivas();
  const mes = hoy().slice(0, 7);
  const kmMes = cs.filter((c) => c.fecha.startsWith(mes)).reduce((a, c) => a + c.distanciaKm, 0);
  return (
    <a class='ejercicio-progreso enlace-ficha' href={cs.length ? '#/progreso?ej=carrera' : '#/carrera'} aria-label='Carrera'>
      <header>
        <span class='disco'><IconoEjercicio id='correr' size={32} /></span>
        <div><h3>Carrera</h3><span class='suave' style='font-size:0.8rem'>{cs.length ? `${cs.length} ${cs.length === 1 ? 'carrera' : 'carreras'}` : 'Apunta tu primera carrera'}</span></div>
        {cs.length > 0 && <div class='rm'><b>{coma(kmMes)} km</b><span>este mes</span></div>}
      </header>
    </a>
  );
}

function BarrasKm({ semanas }: { semanas: { lunes: string; km: number }[] }) {
  const [activa, setActiva] = useState<number | null>(null);
  const W = 340, H = 160, abajo = 22, arriba = 26, hueco = 5;
  const max = Math.max(...semanas.map((s) => s.km), 1);
  const ancho = (W - hueco * (semanas.length - 1)) / semanas.length;
  const a = activa != null ? semanas[activa] : semanas[semanas.length - 1];
  return (
    <figure class='grafica'>
      <svg viewBox={`0 0 ${W} ${H}`} role='img' aria-label={`Km por semana, últimas ${semanas.length} semanas`}>

        {semanas.map((s, i) => {
          const h = (s.km / max) * (H - abajo - arriba), x = i * (ancho + hueco), y = H - abajo - h;
          return (
            <g onPointerDown={() => setActiva(i)} onPointerEnter={() => setActiva(i)} style={{ cursor: 'pointer' }}>
              <rect x={x} y={arriba} width={ancho} height={H - abajo - arriba} fill='transparent' />
              {s.km > 0 && <path d={`M${x + 1} ${H - abajo}V${y + 4}q0 -4 4 -4h${ancho - 10}q4 0 4 4V${H - abajo}`} fill={a === s ? AMARILLO : CIELO} stroke={TINTA} stroke-width='2' stroke-linejoin='round' />}
              {a === s && s.km > 0 && <Etiqueta x={x + ancho / 2} y={y - 14} texto={coma(s.km)} max={W} />}
              {(i === semanas.length - 1 || i % 4 === 0) && <text x={i === 0 ? x : i === semanas.length - 1 ? x + ancho : x + ancho / 2} y={H - 5} text-anchor={i === 0 ? 'start' : i === semanas.length - 1 ? 'end' : 'middle'} font-size='10' font-family={MONO} fill={TEXTO}>{corta(s.lunes)}</text>}
            </g>
          );
        })}
        <line x1='0' x2={W} y1={H - abajo} y2={H - abajo} stroke={TINTA} stroke-width='2.5' />
      </svg>
      <figcaption class='detalle' aria-live='polite'>
        <b>{coma(a.km)} km</b> la semana del {corta(a.lunes)}{activa == null ? ' (esta semana)' : ''}
      </figcaption>
    </figure>
  );
}

function GraficaRitmo({ carreras }: { carreras: Carrera[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  if (carreras.length < 2) return <p class='suave'>Con dos carreras aparecerá aquí tu ritmo a lo largo del tiempo.</p>;
  const W = 340, H = 190, izq = 38, der = 12, arriba = 24, abajo = 24;
  const rs = carreras.map(ritmoSegKm);
  const min = Math.floor(Math.min(...rs) / 15) * 15, max = Math.ceil(Math.max(...rs) / 15) * 15 || min + 15;
  const d = (f: string) => Date.parse(f) / 864e5;
  const t0 = d(carreras[0].fecha), t1 = Math.max(d(carreras[carreras.length - 1].fecha), t0 + 1);
  const X = (f: string) => izq + ((d(f) - t0) / (t1 - t0)) * (W - izq - der);
  // Más rápido arriba: menos segundos por km = más alto.
  const Y = (r: number) => arriba + ((r - min) / (max - min || 1)) * (H - arriba - abajo);
  const paso = max - min >= 120 ? 60 : max - min >= 60 ? 30 : 15;
  const ticks: number[] = [];
  for (let r = Math.ceil(min / paso) * paso; r <= max; r += paso) ticks.push(r);
  const mover = (e: PointerEvent) => {
    const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W;
    let m = 0; carreras.forEach((c, i) => { if (Math.abs(X(c.fecha) - x) < Math.abs(X(carreras[m].fecha) - x)) m = i; }); setActivo(m);
  };
  const a = activo != null ? carreras[activo] : null;
  return (
    <figure class='grafica'>
      <svg viewBox={`0 0 ${W} ${H}`} role='img' aria-label='Ritmo medio de cada carrera; más arriba es más rápido'
        onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setActivo(null)} style={{ touchAction: 'pan-y' }}>
        {ticks.map((r) => <g><line x1={izq} x2={W - der} y1={Y(r)} y2={Y(r)} stroke={REJILLA} stroke-dasharray='3 4' /><text x={izq - 6} y={Y(r) + 3.5} text-anchor='end' font-size='10' font-family={MONO} fill={TEXTO}>{formatearRitmo(r)}</text></g>)}
        <line x1={izq} x2={W - der} y1={H - abajo} y2={H - abajo} stroke={TINTA} stroke-width='2.5' />
        {a && <line x1={X(a.fecha)} x2={X(a.fecha)} y1={arriba} y2={H - abajo} stroke={TINTA} stroke-width='1.5' stroke-dasharray='4 3' />}
        <path d={carreras.map((c, i) => `${i ? 'L' : 'M'}${X(c.fecha).toFixed(1)} ${Y(rs[i]).toFixed(1)}`).join(' ')} fill='none' stroke={TINTA} stroke-width='3' stroke-linejoin='round' stroke-linecap='round' />
        {carreras.map((c, i) => <circle cx={X(c.fecha)} cy={Y(rs[i])} r={a === c ? 6.5 : 4.5} fill={a === c ? AMARILLO : MENTA} stroke={TINTA} stroke-width='2' />)}
        {a && <Etiqueta x={X(a.fecha)} y={Y(rs[activo!]) - 18} texto={formatearRitmo(rs[activo!])} max={W} />}
        <text x={izq} y={H - 6} font-size='10' font-family={MONO} fill={TEXTO}>{corta(carreras[0].fecha)}</text>
        <text x={W - der} y={H - 6} text-anchor='end' font-size='10' font-family={MONO} fill={TEXTO}>{corta(carreras[carreras.length - 1].fecha)}</text>
      </svg>
      <figcaption class='detalle' aria-live='polite'>
        {a ? <><b>{fechaLarga(a.fecha)}</b> · {resumenCarrera(a)}</> : <span class='suave'>Más arriba = más rápido. Toca para ver cada carrera.</span>}
      </figcaption>
    </figure>
  );
}

export function FichaCarrera() {
  const cs = vivas().sort((a, b) => a.fecha.localeCompare(b.fecha));
  const h = hoy();
  const corte = new Date(Date.now() - 365 * 864e5).toISOString().slice(0, 10);
  const mejores = mejoresTiempos(cs);
  const pred = prediccion(cs, h);
  return (
    <main class='pagina'>
      <div class='cabecera-registro'>
        <a href='#/progreso' aria-label='Volver' class='volver'>←</a>
        <h1>Carrera</h1>
      </div>
      <a class='boton' href='#/carrera' style='display:inline-flex;align-items:center;padding:0 18px;text-decoration:none;margin-bottom:6px'>＋ Apuntar carrera</a>
      {cs.length === 0 ? <p class='suave'>Aún no hay carreras.</p> : <>
        <h2>Km por semana</h2>
        <div class='tarjeta'><BarrasKm semanas={kmPorSemana(cs, 12, h)} /></div>
        <h2>Ritmo</h2>
        <div class='tarjeta'><GraficaRitmo carreras={cs.filter((c) => c.fecha >= corte)} /></div>
        <h2>Mejores marcas</h2>
        <div class='tarjeta tabla-carrera'>
          {mejores.length ? mejores.map((m) => (
            <div><span>{DISTANCIAS.find((d) => d.km === m.km)!.nombre}</span><b>{formatearTiempo(m.seg)}</b><small>{formatearRitmo(m.seg / m.km)} /km · {fechaLarga(m.fecha)}</small></div>
          )) : <p class='suave'>Cuando corras 1, 5 o 10 km aparecerán aquí tus mejores tiempos.</p>}
        </div>
        <h2>Predicción</h2>
        <div class='tarjeta tabla-carrera'>
          {pred ? <>
            <p class='suave' style='margin:0 0 6px'>Según tu carrera del {fechaLarga(pred.base.fecha)} ({coma(pred.base.distanciaKm)} km en {formatearTiempo(pred.base.tiempoSeg)}). Es orientativa: cuanto más lejos de esa distancia, menos fiable.</p>
            {pred.tiempos.map((t) => <div><span>{t.nombre}</span><b>{formatearTiempo(t.seg)}</b><small>{formatearRitmo(t.seg / t.km)} /km</small></div>)}
          </> : <p class='suave'>Necesito una carrera de 3 km o más en los últimos 3 meses.</p>}
        </div>
      </>}
    </main>
  );
}
