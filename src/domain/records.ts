import type { Fuerza, Sesion } from './types';
import { repsDeTop } from './reps';
import { conTempo, filtrarPorTempo } from './progreso';

export interface Marca { reps: number; kg: number; fecha: string }
export interface PR { reps: number; kg: number; anteriorKg: number | null; tempo?: string }

/** Tempo con el que se comparan récords: el exacto ('5s', '4s+pausa') o 'sin' si no hubo tempo.
 * Con más segundos de bajada se mueve menos peso, así que cada tempo lleva sus propios récords. */
export const claveTempo = (t?: string) => (conTempo(t) ? t! : 'sin');

/** Sesiones del historial con solo las fuerzas de ese ejercicio hechas al mismo tempo que `f`. */
export const mismoTempo = (historial: Sesion[], f: Fuerza) => filtrarPorTempo(historial, f.ejercicio, claveTempo(f.tempo));

export const ROTACION = ['back-squat', 'press-banca', 'shoulder-press', 'deadlift', 'front-squat'];

function vivas(sesiones: Sesion[]): Sesion[] {
  return sesiones.filter((s) => !s.borrado);
}

export function recordsPorReps(sesiones: Sesion[], ejercicioId: string): Map<number, Marca> {
  const res = new Map<number, Marca>();
  for (const s of vivas(sesiones)) {
    for (const f of s.fuerza) {
      const reps = repsDeTop(f);
      if (f.ejercicio !== ejercicioId || reps == null || f.series.length === 0) continue;
      const kg = Math.max(...f.series);
      const prev = res.get(reps);
      if (!prev || kg > prev.kg) res.set(reps, { reps, kg, fecha: s.fecha });
    }
  }
  return res;
}

export function detectarPR(f: Fuerza, _fecha: string, historial: Sesion[]): PR | null {
  const reps = repsDeTop(f);
  if (reps == null || f.series.length === 0) return null;
  const kg = Math.max(...f.series);
  const prev = recordsPorReps(mismoTempo(historial, f), f.ejercicio).get(reps);
  if (prev && kg <= prev.kg) return null;
  return { reps, kg, anteriorKg: prev ? prev.kg : null, ...(conTempo(f.tempo) ? { tempo: f.tempo } : {}) };
}

function ultimaFecha(sesiones: Sesion[], ejercicioId: string): string | null {
  let ult: string | null = null;
  for (const s of vivas(sesiones)) {
    if (s.fuerza.some((f) => f.ejercicio === ejercicioId) && (!ult || s.fecha > ult)) ult = s.fecha;
  }
  return ult;
}

export function ejercicioSugerido(sesiones: Sesion[], rotacion: string[]): string {
  let mejor = rotacion[0];
  let mejorFecha: string | null | undefined;
  for (const id of rotacion) {
    const f = ultimaFecha(sesiones, id);
    if (f === null) return id;
    if (mejorFecha === undefined || f < (mejorFecha as string)) { mejor = id; mejorFecha = f; }
  }
  return mejor;
}

export function ultimaFuerza(sesiones: Sesion[], ejercicioId: string): Fuerza | null {
  let res: { fecha: string; f: Fuerza } | null = null;
  for (const s of vivas(sesiones)) {
    for (const f of s.fuerza) {
      if (f.ejercicio === ejercicioId && (!res || s.fecha > res.fecha)) res = { fecha: s.fecha, f };
    }
  }
  return res ? res.f : null;
}

/** Días en que alguna fuerza superó la mejor marca previa del mismo ejercicio, número de reps y tempo. */
export function diasConRecord(sesiones: Sesion[]): Set<string> {
  const mejor = new Map<string, number>();
  const dias = new Set<string>();
  for (const s of vivas(sesiones).sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    for (const f of s.fuerza) {
      const r = repsDeTop(f);
      if (r == null || !f.series.length) continue;
      const k = `${f.ejercicio}|${r}|${claveTempo(f.tempo)}`, kg = Math.max(...f.series), prev = mejor.get(k);
      if (prev != null && kg > prev) dias.add(s.fecha);
      if (prev == null || kg > prev) mejor.set(k, kg);
    }
  }
  return dias;
}
