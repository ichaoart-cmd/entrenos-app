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

export function FuerzaForm({ fuerza, onCambio, ejercicios, sesiones, onQuitar }: {
  fuerza: Fuerza; onCambio: (f: Fuerza) => void; ejercicios: Ejercicio[]; sesiones: Sesion[]; onQuitar: () => void;
}) {
  const top = fuerza.series.length ? fuerza.series[fuerza.series.length - 1] : 0;
  const anterior = ultimaFuerza(sesiones, fuerza.ejercicio)?.series;
  const [selector, setSelector] = useState(false);
  const nombres = new Map(ejercicios.map((e) => [e.id, e.nombre]));
  const orden = ejerciciosFrecuentes(sesiones, fuerza.ejercicio).map((id) => ({ id, nombre: nombres.get(id) ?? id }));
  const variantes = variantesDe(fuerza.ejercicio, fuerza.variante);
  const elegir = (id: string) => { if (id !== fuerza.ejercicio) onCambio(fuerzaInicial(id, sesiones)); };
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
      {selector && <Selector onCerrar={() => setSelector(false)} onElegir={(id) => { elegir(id); setSelector(false); }} />}

      {variantes.length > 1 && <>
        <div class='etiq'>Variante</div>
        <Chips etiqueta='Variante' opciones={variantes} valor={fuerza.variante ?? 'normal'} onCambio={(v) => onCambio({ ...fuerza, variante: v })} />
      </>}

      <div class='etiq'>Serie top (kg)</div>
      <div class='peso-grande'>
        <Stepper etiqueta='Serie top (kg)' valor={top} paso={0.5}
          onCambio={(v) => onCambio({ ...fuerza, series: generarRampa(v, anterior, fuerza.series.length) })} />
      </div>
      <div class='minis'>
        <Stepper etiqueta='Reps' valor={fuerza.reps ?? 0} paso={1} min={1} onCambio={(v) => onCambio({ ...fuerza, reps: v })} />
        <Stepper etiqueta='Series' valor={fuerza.series.length} paso={1} min={1}
          onCambio={(n) => onCambio({ ...fuerza, series: generarRampa(top, anterior, Math.min(8, Math.max(1, Math.round(n)))) })} />
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

      <div class='rampa-barras'>
        {fuerza.series.map((v, i) => (
          <div class='rampa-barra'>
            <div class='hueco'><div class='relleno' style={{ height: `${alto(v)}%` }} /></div>
            <input aria-label={`Serie ${i + 1}`} inputMode='decimal' value={String(v)}
              onChange={(e) => {
                const n = parsearKg((e.target as HTMLInputElement).value);
                if (n === null) return;
                onCambio({ ...fuerza, series: fuerza.series.map((x, j) => (j === i ? n : x)) });
              }} />
          </div>
        ))}
      </div>
      <div class='fila'><button type='button' class='peligro' onClick={onQuitar}>Quitar fuerza</button></div>
    </section>
  );
}
