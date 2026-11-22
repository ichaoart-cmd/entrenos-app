import { useState } from 'preact/hooks';
import type { Ejercicio, Fuerza, Sesion } from '../domain/types';
import { generarRampa } from '../domain/rampa';
import { parsearKg } from '../domain/numeros';
import { ROTACION, ultimaFuerza } from '../domain/records';
import { componerTempo, partirTempo } from '../domain/tempo';
import { Chips } from './componentes/Chips';
import { Stepper } from './componentes/Stepper';
import { IconoEjercicio, colorDe } from './iconos';

export const VARIANTES = ['normal', 'btn', 'close grip', 'agarre medio', 'barra alta'] as const;
const SEGUNDOS = [2, 3, 4, 5];
const NUM_SERIES = [3, 4, 5, 6];

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

function Tarjeta({ e, activa, top, onClick }: { e: Ejercicio; activa: boolean; top?: number; onClick: () => void }) {
  return (
    <button type='button' class='tarjeta-ejercicio' aria-pressed={activa} onClick={onClick}
      style={activa ? { borderColor: colorDe(e.id), background: `${colorDe(e.id)}22` } : undefined}>
      <IconoEjercicio id={e.id} size={44} />
      <span class='nombre'>{e.nombre}</span>
      <span class='suave'>{top != null ? `${kg(top)} kg` : '—'}</span>
    </button>
  );
}

export function FuerzaForm({ fuerza, onCambio, ejercicios, sesiones, onQuitar }: {
  fuerza: Fuerza; onCambio: (f: Fuerza) => void; ejercicios: Ejercicio[]; sesiones: Sesion[]; onQuitar: () => void;
}) {
  const top = fuerza.series.length ? fuerza.series[fuerza.series.length - 1] : 0;
  const anterior = ultimaFuerza(sesiones, fuerza.ejercicio)?.series;
  const principales = ejercicios.filter((e) => ROTACION.includes(e.id));
  const [verTodos, setVerTodos] = useState(!ROTACION.includes(fuerza.ejercicio));
  const visibles = verTodos ? ejercicios : principales;
  const ultimoTop = (id: string) => { const u = ultimaFuerza(sesiones, id); return u?.series.length ? Math.max(...u.series) : undefined; };
  const variantes: string[] = VARIANTES.includes(fuerza.variante as any) || !fuerza.variante ? [...VARIANTES] : [...VARIANTES, fuerza.variante];
  const { seg, pausa } = partirTempo(fuerza.tempo);
  const maxSerie = Math.max(...fuerza.series, 1);
  const minSerie = Math.min(...fuerza.series);
  // Altura: 35 % para la más ligera hasta 100 % para la top, para que la subida se vea.
  const alto = (v: number) => (maxSerie === minSerie ? 100 : 35 + (65 * (v - minSerie)) / (maxSerie - minSerie));
  const setTempo = (s: number | null, p: boolean) => onCambio({ ...fuerza, tempo: componerTempo(s, s == null ? false : p) });

  return (
    <section class='tarjeta'>
      <h2>Ejercicio</h2>
      <div class='rejilla-ejercicios'>
        {visibles.map((e) => (
          <Tarjeta e={e} activa={e.id === fuerza.ejercicio} top={ultimoTop(e.id)}
            onClick={() => e.id !== fuerza.ejercicio && onCambio(fuerzaInicial(e.id, sesiones))} />
        ))}
      </div>
      <button type='button' class='enlace' onClick={() => setVerTodos(!verTodos)}>{verTodos ? 'Menos ejercicios' : 'Más ejercicios'}</button>

      <h2>Variante</h2>
      <Chips etiqueta='Variante' opciones={variantes.map((v) => ({ valor: v, texto: v }))} valor={fuerza.variante}
        onCambio={(v) => onCambio({ ...fuerza, variante: v })} />

      <h2>Tempo</h2>
      <div class='chips' role='group' aria-label='Bajada'>
        <button type='button' class='chip' aria-pressed={seg == null} onClick={() => setTempo(null, false)}>Sin tempo</button>
        {SEGUNDOS.map((s) => (
          <button type='button' class='chip' aria-label={`Bajada ${s} s`} aria-pressed={seg === s} onClick={() => setTempo(s, pausa)}>{s} s</button>
        ))}
      </div>
      <div class='chips' role='group' aria-label='Pausa' style='margin-top:8px'>
        <button type='button' class='chip' disabled={seg == null} aria-pressed={seg != null && !pausa} onClick={() => setTempo(seg, false)}>Sin pausa</button>
        <button type='button' class='chip' disabled={seg == null} aria-pressed={seg != null && pausa} onClick={() => setTempo(seg, true)}>Con pausa</button>
      </div>

      <Stepper etiqueta='Serie top (kg)' valor={top} paso={0.5}
        onCambio={(v) => onCambio({ ...fuerza, series: generarRampa(v, anterior, fuerza.series.length) })} />
      <Stepper etiqueta='Reps' valor={fuerza.reps ?? 0} paso={1} min={1}
        onCambio={(v) => onCambio({ ...fuerza, reps: v })} />

      <h2>Series</h2>
      <div class='chips' role='group' aria-label='Número de series'>
        {NUM_SERIES.map((n) => (
          <button type='button' class='chip' aria-label={`${n} series`} aria-pressed={fuerza.series.length === n}
            onClick={() => onCambio({ ...fuerza, series: generarRampa(top, anterior, n) })}>{n}</button>
        ))}
      </div>
      <div class='rampa-barras'>
        {fuerza.series.map((v, i) => (
          <div class='rampa-barra'>
            <div class='hueco'>
              <div class='relleno' style={{ height: `${alto(v)}%`, background: colorDe(fuerza.ejercicio), opacity: i === fuerza.series.length - 1 ? 1 : 0.45 }} />
            </div>
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
