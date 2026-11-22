import type { Fuerza } from './types';

/** Reps de la serie más pesada (la que cuenta para récords y 1RM). */
export function repsDeTop(f: Fuerza): number | null {
  if (!f.repsSeries || f.repsSeries.length !== f.series.length || !f.series.length) return f.reps;
  return f.repsSeries[f.series.indexOf(Math.max(...f.series))];
}

/** Deja `reps` = reps de la serie top y guarda `repsSeries` solo si las reps no son todas iguales. */
export function normalizarReps(f: Fuerza): Fuerza {
  const { repsSeries, ...resto } = f;
  if (!repsSeries || repsSeries.length !== f.series.length) return f;
  const reps = repsDeTop(f);
  return repsSeries.every((r) => r === repsSeries[0]) ? { ...resto, reps } : { ...resto, reps, repsSeries };
}
