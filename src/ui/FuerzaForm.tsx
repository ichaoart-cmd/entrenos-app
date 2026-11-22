import { useState } from 'preact/hooks';
import type { Ejercicio, Fuerza, Objetivo, Sesion } from '../domain/types';
import { generarRampa } from '../domain/rampa';
import { parsearKg } from '../domain/numeros';
import { ROTACION, ultimaFuerza } from '../domain/records';
import { componerTempo, partirTempo } from '../domain/tempo';
import { Chips } from './componentes/Chips';
import { Stepper } from './componentes/Stepper';
import { IconoEjercicio, NOMBRE_CORTO } from './iconos';
import { variantesDe } from '../domain/catalogo';
import { normalizarReps } from '../domain/reps';
import { aplicarObjetivo, estadoSerie } from '../domain/objetivo';
import { Selector } from './Selector';

/** Ejercicios a mano en la fila: la rotación, los usados recientemente y el elegido. */
export function ejerciciosFrecuentes(sesiones: Sesion[], actual: string): string[] {
  const ultimo = new Map<string, string>();
  for (const s of sesiones) if (!s.borrado) for (const f of s.fuerza) if (s.fecha > (ultimo.get(f.ejercicio) ?? '')) ultimo.set(f.ejercicio, s.fecha);
  const recientes = [...ultimo.entries()].sort((a, b) => b[1].localeCompare(a[1])).map(([id]) => id);
  return [...new Set([...ROTACION, actual, ...recientes])].slice(0, 10);
}
const SEGUNDOS = [2, 3, 4, 5];
const kg = (n: number) => String(n).replace('.', ',');

/** Fuerza por defecto para un ejercicio, a partir de su último registro. */
export function fuerzaInicial(ejercicio: string, sesiones: Sesion[]): Fuerza {
  const ult = ultimaFuerza(sesiones, ejercicio);
  if (!ult || ult.series.length === 0) {
    const series = generarRampa(40);
    return { ejercicio, reps: 5, series, tempo: 'sin tempo', variante: 'normal', objetivo: { series, reps: series.map(() => 5) } };
  }
  const top = Math.max(...ult.series), reps = ult.reps ?? 5;
  const series = generarRampa(top, ult.series);
  return {
    ejercicio, reps, series, tempo: ult.tempo ?? 'sin tempo', variante: ult.variante ?? 'normal',
    objetivo: { series, reps: series.map(() => reps) },
  };
}

export function ultimoTop(sesiones: Sesion[], id: string): number | undefined {
  const u = ultimaFuerza(sesiones, id);
  return u?.series.length ? Math.max(...u.series) : undefined;
}

/** Objetivo de una fuerza: el guardado o, en registros antiguos, lo que se hizo. */
export function objetivoDe(f: Fuerza): Objetivo {
  return f.objetivo ?? { series: f.series, reps: f.series.map((_, i) => f.repsSeries?.[i] ?? f.reps ?? 5) };
}

export function FuerzaForm({ fuerza, onCambio, ejercicios, sesiones, onQuitar, abrirSelector = false }: {
  fuerza: Fuerza; onCambio: (f: Fuerza) => void; ejercicios: Ejercicio[]; sesiones: Sesion[]; onQuitar: () => void;
  abrirSelector?: boolean;
}) {
  const anterior = ultimaFuerza(sesiones, fuerza.ejercicio)?.series;
  const [selector, setSelector] = useState(abrirSelector);
  const obj = objetivoDe(fuerza);
  const repsReales = fuerza.series.map((_, i) => fuerza.repsSeries?.[i] ?? fuerza.reps ?? 5);
  // Series ajustadas a mano: ya no siguen al objetivo. Al abrir, las que difieren del objetivo guardado.
  const [tocadas, setTocadas] = useState<Set<number>>(() => new Set(fuerza.series
    .map((v, i) => (v !== obj.series[i] || repsReales[i] !== obj.reps[i] ? i : -1)).filter((i) => i >= 0)));
  const top = obj.series.length ? obj.series[obj.series.length - 1] : 0;
  const repsObj = obj.reps.length ? obj.reps[obj.reps.length - 1] : (fuerza.reps ?? 5);
  const nombres = new Map(ejercicios.map((e) => [e.id, e.nombre]));
  const orden = ejerciciosFrecuentes(sesiones, fuerza.ejercicio).map((id) => ({ id, nombre: nombres.get(id) ?? id }));
  const variantes = variantesDe(fuerza.ejercicio, fuerza.variante);
  const elegir = (id: string) => { if (id !== fuerza.ejercicio) { setTocadas(new Set()); onCambio(fuerzaInicial(id, sesiones)); } };
  const nuevoObjetivo = (o: Objetivo, t = tocadas) => onCambio(aplicarObjetivo(fuerza, o, t));
  const cambiarTop = (v: number) => nuevoObjetivo({ series: generarRampa(v, anterior, obj.series.length), reps: obj.reps });
  const cambiarRepsObjetivo = (v: number) => { const r = Math.max(1, Math.round(v)); nuevoObjetivo({ series: obj.series, reps: obj.series.map(() => r) }); };
  const cambiarNumero = (n: number) => {
    const num = Math.min(8, Math.max(1, Math.round(n)));
    const t = new Set<number>(); setTocadas(t);
    nuevoObjetivo({ series: generarRampa(top, anterior, num), reps: Array(num).fill(repsObj) }, t);
  };
  const ajustar = (i: number, kgReal: number, repsReal: number) => {
    setTocadas(new Set([...tocadas, i]));
    onCambio(normalizarReps({ ...fuerza, objetivo: obj,
      series: fuerza.series.map((x, j) => (j === i ? kgReal : x)),
      repsSeries: repsReales.map((x, j) => (j === i ? Math.max(1, Math.round(repsReal)) : x)) }));
  };
  const { seg, pausa } = partirTempo(fuerza.tempo);
  const max = Math.max(...fuerza.series, ...obj.series, 1), min = Math.min(...fuerza.series, ...obj.series);
  const alto = (v: number) => (max === min ? 100 : 35 + (65 * (v - min)) / (max - min));
  const setTempo = (s: number | null, p: boolean) => onCambio({ ...fuerza, tempo: componerTempo(s, s == null ? false : p) });

  return (
    <section aria-label='Fuerza'>
      <div class='circulos' role='group' aria-label='Ejercicio'>
        {orden.map((e) => {
          const t = ultimoTop(sesiones, e.id);
          return (
            <button type='button' class='circulo' aria-label={e.nombre} aria-pressed={e.id === fuerza.ejercicio}
              onClick={() => elegir(e.id)}>
              <span class='disco'><IconoEjercicio id={e.id} size={40} /></span>
              <span>{NOMBRE_CORTO[e.id] ?? e.nombre}</span>
              <span class='kg'>{t != null ? `${kg(t)} kg` : '—'}</span>
            </button>
          );
        })}
        <button type='button' class='circulo' aria-label='Más ejercicios' onClick={() => setSelector(true)}>
          <span class='disco mas'>＋</span><span>Más</span><span class='kg'>&nbsp;</span>
        </button>
      </div>
      <p class='pista-texto'>¿Hoy haces otro? Toca su círculo o «Más».</p>
      {selector && <Selector onCerrar={() => setSelector(false)} onElegir={(id) => { elegir(id); setSelector(false); }} />}

      {variantes.length > 1 && <>
        <div class='etiq'>Variante</div>
        <Chips etiqueta='Variante' opciones={variantes} valor={fuerza.variante ?? 'normal'} onCambio={(v) => onCambio({ ...fuerza, variante: v })} />
      </>}

      <h3 class='bloque'>Objetivo</h3>
      <div class='etiq'>Serie top (kg)</div>
      <div class='peso-grande'>
        <Stepper etiqueta='Serie top (kg)' valor={top} paso={0.5} onCambio={cambiarTop} />
      </div>
      <div class='minis'>
        <Stepper etiqueta='Reps' valor={repsObj} paso={1} min={1} onCambio={cambiarRepsObjetivo} />
        <Stepper etiqueta='Series' valor={fuerza.series.length} paso={1} min={1} onCambio={cambiarNumero} />
      </div>

      <div class='etiq'>Tempo de bajada</div>
      <div class='chips' role='group' aria-label='Bajada'>
        <button type='button' class='chip' aria-pressed={seg == null} onClick={() => setTempo(null, false)}>Sin tempo</button>
        {SEGUNDOS.map((s) => (
          <button type='button' class='chip' aria-label={`Bajada ${s} s`} aria-pressed={seg === s} onClick={() => setTempo(s, pausa)}>{s} s</button>
        ))}
      </div>
      <button type='button' role='switch' class='interruptor' aria-checked={seg != null && pausa} disabled={seg == null}
        onClick={() => setTempo(seg, !pausa)}>
        <span>Con pausa abajo</span><span class='pista' aria-hidden='true' />
      </button>

      <h3 class='bloque'>Lo que hiciste</h3>
      <p class='pista-texto'>Se rellena con el objetivo. Si en alguna serie no llegas (o la superas), cambia el peso o las reps.</p>
      <div class='lista-series'>
        {fuerza.series.map((v, i) => {
          const estado = obj.series[i] != null ? estadoSerie(v, repsReales[i], obj.series[i], obj.reps[i]) : 'cumplido';
          return (
            <div class={`serie ${estado}${i === fuerza.series.length - 1 ? ' top' : ''}`}>
              <span class='barra-fondo' style={{ width: `${alto(v)}%` }} aria-hidden='true' />
              <span class='nombre'>
                <b>{i === fuerza.series.length - 1 ? 'Top' : `${i + 1}ª`}</b>
                {obj.series[i] != null && <small>Objetivo {kg(obj.series[i])} × {obj.reps[i]}</small>}
                {estado !== 'cumplido' && <small class='marca'>{estado === 'no-alcanzado' ? 'No alcanzado' : 'Superado'}</small>}
              </span>
              <Stepper etiqueta={`Serie ${i + 1}`} valor={v} paso={1} onCambio={(n) => ajustar(i, n, repsReales[i])} />
              <span class='reps-serie'>
                <span class='por' aria-hidden='true'>×</span>
                <Stepper etiqueta={`Reps serie ${i + 1}`} valor={repsReales[i]} paso={1} min={1} onCambio={(n) => ajustar(i, v, n)} />
              </span>
            </div>
          );
        })}
      </div>
      <div class='fila'><button type='button' class='peligro' onClick={onQuitar}>Quitar fuerza</button></div>
    </section>
  );
}
