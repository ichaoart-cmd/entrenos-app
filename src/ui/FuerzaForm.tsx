import { useState } from 'preact/hooks';
import type { Ejercicio, Fuerza, Sesion } from '../domain/types';
import { generarRampa } from '../domain/rampa';
import { parsearKg } from '../domain/numeros';
import { ROTACION, ultimaFuerza } from '../domain/records';
import { componerTempo, partirTempo } from '../domain/tempo';
import { Chips } from './componentes/Chips';
import { Stepper } from './componentes/Stepper';
import { IconoEjercicio, NOMBRE_CORTO } from './iconos';
import { variantesDe } from '../domain/catalogo';
import { normalizarReps } from '../domain/reps';
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
    return { ejercicio, reps: 5, series: generarRampa(40), tempo: 'sin tempo', variante: 'normal' };
  }
  const top = Math.max(...ult.series);
  return {
    ejercicio, reps: ult.reps ?? 5, series: generarRampa(top, ult.series),
    tempo: ult.tempo ?? 'sin tempo', variante: ult.variante ?? 'normal',
  };
}

export function ultimoTop(sesiones: Sesion[], id: string): number | undefined {
  const u = ultimaFuerza(sesiones, id);
  return u?.series.length ? Math.max(...u.series) : undefined;
}

export function FuerzaForm({ fuerza, onCambio, ejercicios, sesiones, onQuitar, autoInicial = true, abrirSelector = false }: {
  fuerza: Fuerza; onCambio: (f: Fuerza) => void; ejercicios: Ejercicio[]; sesiones: Sesion[]; onQuitar: () => void;
  autoInicial?: boolean; abrirSelector?: boolean;
}) {
  const top = fuerza.series.length ? fuerza.series[fuerza.series.length - 1] : 0;
  const anterior = ultimaFuerza(sesiones, fuerza.ejercicio)?.series;
  const [selector, setSelector] = useState(abrirSelector);
  // Automático: la aproximación se calcula desde la serie top. Manual: se respetan los pesos de cada serie.
  const [auto, setAuto] = useState(autoInicial);
  const nombres = new Map(ejercicios.map((e) => [e.id, e.nombre]));
  const orden = ejerciciosFrecuentes(sesiones, fuerza.ejercicio).map((id) => ({ id, nombre: nombres.get(id) ?? id }));
  const variantes = variantesDe(fuerza.ejercicio, fuerza.variante);
  const elegir = (id: string) => { if (id !== fuerza.ejercicio) { setAuto(true); onCambio(fuerzaInicial(id, sesiones)); } };
  // Reps de cada serie (si no hay detalle, todas iguales a las generales).
  const repsDe = (n: number, base = fuerza) => Array.from({ length: n }, (_, i) => base.repsSeries?.[i] ?? base.reps ?? 5);
  const emitir = (f: Fuerza) => onCambio(normalizarReps({ ...f, repsSeries: f.repsSeries ?? repsDe(f.series.length, f) }));
  const conSeries = (series: number[], repsSeries?: number[]) => {
    const rs = repsSeries ?? (fuerza.repsSeries
      ? (series.length > fuerza.series.length
        ? [...fuerza.repsSeries.slice(0, -1), ...Array(series.length - fuerza.series.length).fill(fuerza.repsSeries.at(-2) ?? fuerza.reps ?? 5), fuerza.repsSeries.at(-1)!]
        : fuerza.repsSeries.slice(fuerza.repsSeries.length - series.length))
      : undefined);
    emitir({ ...fuerza, series, repsSeries: rs ?? repsDe(series.length) });
  };
  const cambiarRepsSerie = (i: number, r: number) => emitir({ ...fuerza, repsSeries: repsDe(fuerza.series.length).map((x, j) => (j === i ? Math.max(1, Math.round(r)) : x)) });
  const cambiarTop = (v: number) => conSeries(auto ? generarRampa(v, anterior, fuerza.series.length) : [...fuerza.series.slice(0, -1), v]);
  const cambiarNumero = (n: number) => {
    const num = Math.min(8, Math.max(1, Math.round(n))), act = fuerza.series;
    if (auto || !act.length) return conSeries(generarRampa(top, anterior, num));
    if (num > act.length) {
      const relleno = act.length > 1 ? act[act.length - 2] : act[0];
      return conSeries([...act.slice(0, -1), ...Array(num - act.length).fill(relleno), act[act.length - 1]]);
    }
    conSeries(act.slice(act.length - num));
  };
  const cambiarSerie = (i: number, v: number) => { setAuto(false); conSeries(fuerza.series.map((x, j) => (j === i ? v : x))); };
  const alternarAuto = () => { if (!auto) conSeries(generarRampa(top, anterior, fuerza.series.length)); setAuto(!auto); };
  const { seg, pausa } = partirTempo(fuerza.tempo);
  const max = Math.max(...fuerza.series, 1), min = Math.min(...fuerza.series);
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

      <div class='etiq'>Serie top (kg)</div>
      <div class='peso-grande'>
        <Stepper etiqueta='Serie top (kg)' valor={top} paso={0.5} onCambio={cambiarTop} />
      </div>
      <div class='minis'>
        <Stepper etiqueta='Reps' valor={fuerza.reps ?? 0} paso={1} min={1}
          onCambio={(v) => { const r = Math.max(1, Math.round(v)); emitir({ ...fuerza, reps: r, repsSeries: fuerza.series.map(() => r) }); }} />
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

      <div class='etiq'>Series: peso y repeticiones</div>
      <button type='button' role='switch' class='interruptor' aria-label='Calcular aproximación' aria-checked={auto} onClick={alternarAuto}>
        <span>Calcular aproximación<small class='suave'>{auto ? 'Se rellena desde la serie top' : 'Pesos escritos por ti'}</small></span>
        <span class='pista' aria-hidden='true' />
      </button>
      <div class='lista-series'>
        {fuerza.series.map((v, i) => (
          <div class={`serie${i === fuerza.series.length - 1 ? ' top' : ''}`}>
            <span class='barra-fondo' style={{ width: `${alto(v)}%` }} aria-hidden='true' />
            <span class='nombre'>{i === fuerza.series.length - 1 ? 'Top' : `${i + 1}ª`}</span>
            <Stepper etiqueta={`Serie ${i + 1}`} valor={v} paso={1} onCambio={(n) => cambiarSerie(i, n)} />
            <span class='reps-serie'>
              <span class='por' aria-hidden='true'>×</span>
              <Stepper etiqueta={`Reps serie ${i + 1}`} valor={repsDe(fuerza.series.length)[i]} paso={1} min={1} onCambio={(n) => cambiarRepsSerie(i, n)} />
            </span>
          </div>
        ))}
      </div>
      <div class='fila'><button type='button' class='peligro' onClick={onQuitar}>Quitar fuerza</button></div>
    </section>
  );
}
