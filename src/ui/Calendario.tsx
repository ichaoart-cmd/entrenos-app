import { useState } from 'preact/hooks';
import type { Carrera, Sesion } from '../domain/types';
import { rachaSemanas, semanasDelMes, sesionesPorDia } from '../domain/calendario';
import { diasConRecord } from '../domain/records';
import { nombreEjercicio } from './formato';
import { TIPOS, colorTipo, nombreTipo, tiposPorDia, type TipoEntreno } from '../domain/tipos';
import { hoy } from './Registrar';
import { variantesDe } from '../domain/catalogo';
import { partirTempo } from '../domain/tempo';
import { tipoEjercicio } from '../domain/tipos';
import { MOVIMIENTOS } from '../domain/benchmarks';
import { fechaLarga, resumenCarrera } from './formato';
import type { Fuerza } from '../domain/types';

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
  const [sel, setSel] = useState<string | null>(null);
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
          const clase = `cal-dia${ses.length || cs.length ? ' entrenado' : ''}${ts.length ? ' con-tipo' : ''}${rec ? ' record' : ''}${d === h ? ' hoy' : ''}${d > h ? ' futuro' : ''}${d === sel ? ' elegido' : ''}`;
          // Día entrenado: se toca para ver abajo qué se hizo. Día vacío: abre el registro con esa fecha.
          if (!ses.length && !cs.length) return <a href={href} aria-label={etiquetaDia(d, ses, rec, cs, ts)} class={clase}><span>{Number(d.slice(8))}</span></a>;
          return (
            <button type='button' aria-label={etiquetaDia(d, ses, rec, cs, ts)} aria-pressed={d === sel} style={ts.length ? { '--anillo': anillo(ts) } : undefined}
              class={clase} onClick={() => setSel(d === sel ? null : d)}>
              <span>{Number(d.slice(8))}</span>
            </button>
          );
        })}
      </div>
      {sel && sel.startsWith(prefijo) ? <DetalleDia fecha={sel} ses={porDia.get(sel) ?? []} cs={corridos.get(sel) ?? []} record={records.has(sel)} />
        : delMes > 0 && <p class='cal-pista'>Toca un día para ver qué hiciste.</p>}
      </>}
      <div class='cal-leyenda'>
        {TIPOS.map((t) => <span><i style={{ background: t.color }} />{t.nombre}</span>)}
        <span><b class='estrella' aria-hidden='true'>★</b>Récord</span>
        <span class='racha-nota'>Racha: semanas con {minSemana} entrenos o más</span>
      </div>
    </section>
  );
}

const FORMATO: Record<string, string> = { ForTime: 'For Time' };
const coma = (n: number) => String(n).replace('.', ',');

function lineaFuerza(f: Fuerza): string {
  const reps = f.series.map((_, i) => f.repsSeries?.[i] ?? f.reps);
  const iguales = reps.every((r) => r === reps[0]);
  const series = iguales
    ? `${f.series.length}×${reps[0] ?? '?'} · ${f.series.map(coma).join(' – ')} kg`
    : f.series.map((kg, i) => `${coma(kg)}×${reps[i] ?? '?'}`).join(' · ') + ' kg';
  const { seg, pausa } = partirTempo(f.tempo);
  return `${series}${seg != null ? ` · bajada ${seg} s${pausa ? ' + pausa' : ''}` : ''}`;
}

/** Qué se hizo el día tocado: ejercicio exacto con variante, series, pesos y tempo; Metcon y carrera. */
function DetalleDia({ fecha, ses, cs, record }: { fecha: string; ses: Sesion[]; cs: Carrera[]; record: boolean }) {
  return (
    <div class='cal-detalle' aria-live='polite'>
      <div class='cal-detalle-cab'><strong>{fechaLarga(fecha)}</strong>{record && <span class='estrella'>★ Récord</span>}</div>
      {ses.map((s) => <>
        {s.fuerza.map((f) => {
          const t = tipoEjercicio(f.ejercicio);
          const variante = f.variante && f.variante !== 'normal' ? variantesDe(f.ejercicio, f.variante).find((v) => v.valor === f.variante)?.texto : null;
          return (
            <div class='cal-item'>
              <i style={t ? { background: colorTipo(t) } : undefined} />
              <div><b>{nombreEjercicio(f.ejercicio)}{variante ? ` · ${variante}` : ''}</b><span>{f.series.length ? lineaFuerza(f) : 'Sin series'}</span></div>
            </div>
          );
        })}
        {s.metcon && (
          <div class='cal-item'>
            <i style={{ background: colorTipo('metcon') }} />
            <div>
              <b>Metcon · {FORMATO[s.metcon.formato] ?? s.metcon.formato}{s.metcon.duracionMin ? ` ${s.metcon.duracionMin} min` : ''}</b>
              <span>{[s.metcon.resultado?.valor, s.metcon.rx === false ? 'Escalado' : 'RX', s.metcon.equipo ? 'En equipo' : null,
                ...(s.metcon.movimientos ?? []).map((m) => MOVIMIENTOS.find((x) => x.id === m)?.nombre ?? m)].filter(Boolean).join(' · ')}</span>
              {s.metcon.descripcion && <span class='desc'>{s.metcon.descripcion.trim()}</span>}
            </div>
          </div>
        )}
        <a class='enlace' href={`#/registrar?id=${encodeURIComponent(s.id)}`}>Editar sesión →</a>
      </>)}
      {cs.map((c) => <>
        <div class='cal-item'><i style={{ background: colorTipo('carrera') }} /><div><b>Carrera</b><span>{resumenCarrera(c)}</span></div></div>
        <a class='enlace' href={`#/carrera?id=${encodeURIComponent(c.id)}`}>Editar carrera →</a>
      </>)}
    </div>
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
