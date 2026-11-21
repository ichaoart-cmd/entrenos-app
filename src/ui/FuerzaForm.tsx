import type { Ejercicio, Fuerza, Sesion } from '../domain/types';
import { generarRampa } from '../domain/rampa';
import { parsearKg } from '../domain/numeros';
import { ultimaFuerza } from '../domain/records';
import { Chips } from './componentes/Chips';
import { Stepper } from './componentes/Stepper';

export const TEMPOS = ['3s+pausa', '4s+pausa', 'sin tempo'] as const;
export const VARIANTES = ['normal', 'btn', 'close grip', 'agarre medio', 'barra alta'] as const;

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

export function FuerzaForm({ fuerza, onCambio, ejercicios, sesiones, onQuitar }: {
  fuerza: Fuerza; onCambio: (f: Fuerza) => void; ejercicios: Ejercicio[]; sesiones: Sesion[]; onQuitar: () => void;
}) {
  const top = fuerza.series.length ? fuerza.series[fuerza.series.length - 1] : 0;
  const anterior = ultimaFuerza(sesiones, fuerza.ejercicio)?.series;
  const tempos: string[] = fuerza.tempo && !(TEMPOS as readonly string[]).includes(fuerza.tempo) ? [...TEMPOS, fuerza.tempo] : [...TEMPOS];
  const variantes = VARIANTES.includes(fuerza.variante as any) || !fuerza.variante ? VARIANTES : [...VARIANTES, fuerza.variante];
  return (
    <section class="tarjeta">
      <div class="fila">
        <label class="etiqueta" for="ejercicio">Ejercicio</label>
        <select id="ejercicio" aria-label="Ejercicio" value={fuerza.ejercicio}
          onChange={(e) => onCambio(fuerzaInicial((e.target as HTMLSelectElement).value, sesiones))}>
          {ejercicios.map((e) => <option value={e.id}>{e.nombre}</option>)}
        </select>
      </div>
      <h2>Variante</h2>
      <Chips etiqueta="Variante" opciones={variantes.map((v) => ({ valor: v, texto: v }))} valor={fuerza.variante}
        onCambio={(v) => onCambio({ ...fuerza, variante: v })} />
      <h2>Tempo</h2>
      <Chips etiqueta="Tempo" opciones={tempos.map((v) => ({ valor: v, texto: v }))} valor={fuerza.tempo}
        onCambio={(v) => onCambio({ ...fuerza, tempo: v })} />
      <Stepper etiqueta="Serie top (kg)" valor={top} paso={0.5}
        onCambio={(v) => onCambio({ ...fuerza, series: generarRampa(v, anterior) })} />
      <Stepper etiqueta="Reps" valor={fuerza.reps ?? 0} paso={1} min={1}
        onCambio={(v) => onCambio({ ...fuerza, reps: v })} />
      <h2>Series (kg)</h2>
      <div class="rampa">
        {fuerza.series.map((kg, i) => (
          <input aria-label={`Serie ${i + 1}`} inputMode="decimal" value={String(kg)}
            onChange={(e) => {
              const n = parsearKg((e.target as HTMLInputElement).value);
              if (n === null) return;
              onCambio({ ...fuerza, series: fuerza.series.map((x, j) => (j === i ? n : x)) });
            }} />
        ))}
      </div>
      <div class="fila"><button type="button" class="peligro" onClick={onQuitar}>Quitar fuerza</button></div>
    </section>
  );
}
