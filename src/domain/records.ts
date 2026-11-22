import type { Fuerza, Sesion } from './types';

export interface Marca { reps: number; kg: number; fecha: string }
export interface PR { reps: number; kg: number; anteriorKg: number | null }

export const ROTACION = ['back-squat', 'press-banca', 'shoulder-press', 'deadlift', 'front-squat'];

function vivas(sesiones: Sesion[]): Sesion[] {
  return sesiones.filter((s) => !s.borrado);
}

export function recordsPorReps(sesiones: Sesion[], ejercicioId: string): Map<number, Marca> {
  const res = new Map<number, Marca>();
  for (const s of vivas(sesiones)) {
    for (const f of s.fuerza) {
      if (f.ejercicio !== ejercicioId || f.reps == null || f.series.length === 0) continue;
      const kg = Math.max(...f.series);
      const prev = res.get(f.reps);
      if (!prev || kg > prev.kg) res.set(f.reps, { reps: f.reps, kg, fecha: s.fecha });
    }
  }
  return res;
}

export function detectarPR(f: Fuerza, _fecha: string, historial: Sesion[]): PR | null {
  if (f.reps == null || f.series.length === 0) return null;
  const kg = Math.max(...f.series);
  const prev = recordsPorReps(historial, f.ejercicio).get(f.reps);
  if (prev && kg <= prev.kg) return null;
  return { reps: f.reps, kg, anteriorKg: prev ? prev.kg : null };
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

/** Días en que alguna fuerza superó la mejor marca previa del mismo ejercicio y número de reps. */
export function diasConRecord(sesiones: Sesion[]): Set<string> {
  const mejor = new Map<string, number>();
  const dias = new Set<string>();
  for (const s of vivas(sesiones).sort((a, b) => a.fecha.localeCompare(b.fecha))) {
    for (const f of s.fuerza) {
      if (f.reps == null || !f.series.length) continue;
      const k = `${f.ejercicio}|${f.reps}`, kg = Math.max(...f.series), prev = mejor.get(k);
      if (prev != null && kg > prev) dias.add(s.fecha);
      if (prev == null || kg > prev) mejor.set(k, kg);
    }
  }
  return dias;
}
