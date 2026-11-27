import type { Sesion } from './types';
import { e1rm } from './rm';
import { repsDeTop } from './reps';
import { partirTempo } from './tempo';

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

/** 'todas', 'sin', 'con' (cualquier tempo) o un tempo exacto tal como se guarda ('5s', '4s+pausa'). */
export type FiltroTempo = 'todas' | 'sin' | 'con' | (string & {});

/** ¿Se hizo con tempo (bajada controlada)? Sin dato o 'sin tempo' = no. */
export function conTempo(tempo?: string): boolean {
  return !!tempo && tempo !== 'sin tempo';
}

/** Sesiones con solo las fuerzas de `ejercicio` que cumplen el filtro de tempo (las demás sesiones fuera). */
export function filtrarPorTempo(sesiones: Sesion[], ejercicio: string, filtro: FiltroTempo): Sesion[] {
  if (filtro === 'todas') return sesiones;
  const cumple = filtro === 'con' || filtro === 'sin'
    ? (t?: string) => conTempo(t) === (filtro === 'con')
    : (t?: string) => t === filtro;
  return sesiones
    .map((s) => ({ ...s, fuerza: s.fuerza.filter((f) => f.ejercicio === ejercicio && cumple(f.tempo)) }))
    .filter((s) => s.fuerza.length > 0);
}

/** Tempos distintos usados en `ejercicio` (sin contar «sin tempo»), de menos a más segundos y la pausa detrás. */
export function temposUsados(sesiones: Sesion[], ejercicio: string): string[] {
  const t = new Set<string>();
  for (const s of sesiones) if (!s.borrado) for (const f of s.fuerza) if (f.ejercicio === ejercicio && f.series.length && conTempo(f.tempo)) t.add(f.tempo!);
  const clave = (x: string) => { const p = partirTempo(x); return (p.seg ?? 99) * 2 + (p.pausa ? 1 : 0); };
  return [...t].sort((a, b) => clave(a) - clave(b) || a.localeCompare(b));
}

/** Texto para leer un tempo: '4s+pausa' → '4 s + pausa'. */
export function textoTempo(t: string): string {
  const p = partirTempo(t);
  return p.seg == null ? t : `${p.seg} s${p.pausa ? ' + pausa' : ''}`;
}
