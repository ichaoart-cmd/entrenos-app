import { useState } from 'preact/hooks';
import type { Carrera, Sesion } from '../domain/types';
import { rachaSemanas, semanasDelMes, sesionesPorDia } from '../domain/calendario';
import { diasConRecord } from '../domain/records';
import { nombreEjercicio } from './formato';
import { TIPOS, colorTipo, nombreTipo, tiposPorDia, type TipoEntreno } from '../domain/tipos';
import { hoy } from './Registrar';

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const DIAS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function etiquetaDia(d: string, ses: Sesion[], record: boolean, cs: Carrera[] = [], tipos: TipoEntreno[] = []): string {
  const n = String(Number(d.slice(8)));
  if (!ses.length && !cs.length) return n;
  const cosas = [...ses.flatMap((s) => [...s.fuerza.map((f) => nombreEjercicio(f.ejercicio)), ...(s.metcon ? ['Metcon'] : [])]),
    ...cs.map((c) => `carrera ${String(c.distanciaKm).replace('.', ',')} km`)];
  return `${n} · ${cosas.length ? cosas.join(', ') : 'entreno'}${tipos.length ? ` · ${tipos.map(nombreTipo).join(', ')}` : ''}${record ? ', récord' : ''}`;
}

export function Calendario({ sesiones, minSemana, carreras = [] }: { sesiones: Sesion[]; minSemana: number; carreras?: Carrera[] }) {
  const h = hoy();
  const [ym, setYm] = useState({ a: Number(h.slice(0, 4)), m: Number(h.slice(5, 7)) });
  const porDia = sesionesPorDia(sesiones);
  const records = diasConRecord(sesiones);
  const tipos = tiposPorDia(sesiones, carreras);
  const corridos = new Map<string, Carrera[]>();
  for (const c of carreras) if (!c.borrado) corridos.set(c.fecha, [...(corridos.get(c.fecha) ?? []), c]);
  const prefijo = `${ym.a}-${String(ym.m).padStart(2, '0')}`;
  const dias = new Set([...porDia.keys(), ...corridos.keys()]);
  const delMes = [...dias].filter((d) => d.startsWith(prefijo)).length;
  const racha = rachaSemanas([...porDia.entries(), ...corridos.entries()].flatMap(([d, s]) => s.map(() => d)), minSemana, h);
  const [vista, setVista] = useState<'mes' | 'anio'>('mes');
  const mover = (delta: number) => setYm(({ a, m }) => { const t = a * 12 + (m - 1) + delta; return { a: Math.floor(t / 12), m: (t % 12) + 1 }; });

  return (
    <section class='tarjeta calendario'>
      <div class='cal-vista' role='group' aria-label='Vista del calendario'>
        <button type='button' aria-pressed={vista === 'mes'} onClick={() => setVista('mes')}>Mes</button>
        <button type='button' aria-pressed={vista === 'anio'} onClick={() => setVista('anio')}>Año</button>
      </div>
      {vista === 'anio' ? <VistaAnio anio={ym.a} tipos={tipos} hoy={h} onAnio={(a) => setYm({ a, m: ym.m })}
        onMes={(m) => { setYm({ a: ym.a, m }); setVista('mes'); }} /> : <>
      <div class='cal-cabecera'>
        <button type='button' aria-label='Mes anterior' onClick={() => mover(-1)}>‹</button>
        <strong>{MESES[ym.m - 1]} {ym.a}</strong>
        <button type='button' aria-label='Mes siguiente' onClick={() => mover(1)}>›</button>
      </div>
      <div class='cal-resumen'>
        <span><b>{delMes}</b>{delMes === 1 ? 'sesión' : 'sesiones'} este mes</span>
        <span><b>{racha}</b>{racha === 1 ? 'semana seguida' : 'semanas seguidas'}</span>
      </div>
      <div class='cal-rejilla'>
        {DIAS.map((d) => <span class='cal-dia-nombre'>{d}</span>)}
        {semanasDelMes(ym.a, ym.m).flat().map((d) => {
          if (!d) return <span />;
          const ses = porDia.get(d) ?? [];
          const cs = corridos.get(d) ?? [];
          const rec = records.has(d);
          const href = ses.length ? `#/registrar?id=${encodeURIComponent(ses[0].id)}`
            : cs.length ? `#/carrera?id=${encodeURIComponent(cs[0].id)}` : `#/registrar?fecha=${d}`;
          const ts = tipos.get(d) ?? [];
          return (
            <a href={href} aria-label={etiquetaDia(d, ses, rec, cs, ts)} style={ts.length ? { '--anillo': anillo(ts) } : undefined}
              class={`cal-dia${ses.length || cs.length ? ' entrenado' : ''}${ts.length ? ' con-tipo' : ''}${rec ? ' record' : ''}${d === h ? ' hoy' : ''}${d > h ? ' futuro' : ''}`}>
              <span>{Number(d.slice(8))}</span>
            </a>
          );
        })}
      </div>
      </>}
      <div class='cal-leyenda'>
        {TIPOS.map((t) => <span><i style={{ background: t.color }} />{t.nombre}</span>)}
        <span><b class='estrella' aria-hidden='true'>★</b>Récord</span>
        <span class='racha-nota'>Racha: semanas con {minSemana} entrenos o más</span>
      </div>
    </section>
  );
}

/** Anillo partido en segmentos iguales, uno por tipo, con una pequeña separación entre ellos. */
function anillo(ts: TipoEntreno[]): string {
  if (ts.length === 1) return colorTipo(ts[0]);
  const paso = 360 / ts.length, hueco = 7;
  const partes = ts.flatMap((t, i) => [
    `var(--papel) ${i * paso}deg ${i * paso + hueco / 2}deg`,
    `${colorTipo(t)} ${i * paso + hueco / 2}deg ${(i + 1) * paso - hueco / 2}deg`,
    `var(--papel) ${(i + 1) * paso - hueco / 2}deg ${(i + 1) * paso}deg`,
  ]);
  return `conic-gradient(${partes.join(', ')})`;
}

/** Año entero: 12 minimeses con un cuadradito por día, del color del tipo principal de ese día. */
function VistaAnio({ anio, tipos, hoy: h, onAnio, onMes }: {
  anio: number; tipos: Map<string, TipoEntreno[]>; hoy: string; onAnio: (a: number) => void; onMes: (m: number) => void;
}) {
  const total = [...tipos.keys()].filter((d) => d.startsWith(`${anio}-`)).length;
  return (
    <>
      <div class='cal-cabecera'>
        <button type='button' aria-label='Año anterior' onClick={() => onAnio(anio - 1)}>‹</button>
        <strong>{anio}</strong>
        <button type='button' aria-label='Año siguiente' onClick={() => onAnio(anio + 1)}>›</button>
      </div>
      <div class='cal-resumen'><span><b>{total}</b>días entrenados en {anio}</span></div>
      <div class='cal-anio'>
        {MESES.map((nombre, i) => (
          <button type='button' class='mini-mes' aria-label={`Ver ${nombre}`} onClick={() => onMes(i + 1)}>
            <span class='mini-nombre' aria-hidden='true'>{nombre.slice(0, 3)}</span>
            <span class='mini-rejilla'>
              {semanasDelMes(anio, i + 1).flat().map((d) => {
                if (!d) return <i class='vacio' />;
                const ts = tipos.get(d) ?? [];
                return <i role={ts.length ? 'img' : undefined} class={`${d === h ? 'hoy' : ''}${d > h ? ' futuro' : ''}`} style={ts.length ? { background: colorTipo(ts[0]) } : undefined}
                  aria-label={ts.length ? `${Number(d.slice(8))} ${nombre}: ${ts.map(nombreTipo).join(', ')}` : undefined} />;
              })}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
