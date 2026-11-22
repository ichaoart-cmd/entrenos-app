import type { Sesion } from './types';
import { e1rm } from './rm';
import { repsDeTop } from './reps';

export interface Punto { fecha: string; kg: number; reps: number; e1rm: number }

/** Una entrada por sesión con el ejercicio: serie top, reps y 1RM estimado, por fecha ascendente. */
export function serieProgreso(sesiones: Sesion[], ejercicio: string): Punto[] {
  const puntos: Punto[] = [];
  for (const s of sesiones) {
    if (s.borrado) continue;
    for (const f of s.fuerza) {
      const reps = repsDeTop(f);
      if (f.ejercicio !== ejercicio || reps == null || !f.series.length) continue;
      const kg = Math.max(...f.series);
      puntos.push({ fecha: s.fecha, kg, reps, e1rm: e1rm(kg, reps) });
    }
  }
  return puntos.sort((a, b) => a.fecha.localeCompare(b.fecha));
}
