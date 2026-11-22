import type { Fuerza, Objetivo } from './types';
import { normalizarReps } from './reps';

export type EstadoSerie = 'cumplido' | 'no-alcanzado' | 'superado';

/** Compara una serie real con su objetivo: por debajo en peso o reps = no alcanzado; por encima = superado. */
export function estadoSerie(kg: number, reps: number, objKg: number, objReps: number): EstadoSerie {
  if (kg < objKg || reps < objReps) return 'no-alcanzado';
  if (kg > objKg || reps > objReps) return 'superado';
  return 'cumplido';
}

/**
 * Pone un objetivo nuevo: las series que el usuario no ha tocado copian el objetivo;
 * las tocadas conservan su valor real. Normaliza `reps`/`repsSeries` a lo real.
 */
export function aplicarObjetivo(f: Fuerza, objetivo: Objetivo, tocadas: Set<number>): Fuerza {
  const repsReales = f.repsSeries ?? f.series.map(() => f.reps ?? objetivo.reps[0]);
  const series = objetivo.series.map((kg, i) => (tocadas.has(i) && f.series[i] != null ? f.series[i] : kg));
  const repsSeries = objetivo.reps.map((r, i) => (tocadas.has(i) && repsReales[i] != null ? repsReales[i] : r));
  return normalizarReps({ ...f, series, repsSeries, objetivo });
}
