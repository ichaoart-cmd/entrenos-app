import type { PesoCorporal, Sesion } from './types';
import { recordsPorReps } from './records';
import { e1rm, esFiable } from './rm';

/** Pesadas vigentes, de la más antigua a la más reciente. */
export function pesosVivos(pesos: PesoCorporal[]): PesoCorporal[] {
  return pesos.filter((p) => !p.borrado).sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Peso corporal en una fecha: el último apuntado hasta ese día; si no hay ninguno antes, el primero. */
export function pesoEn(pesos: PesoCorporal[], fecha: string): number | null {
  const vivos = pesosVivos(pesos);
  if (!vivos.length) return null;
  const antes = vivos.filter((p) => p.fecha <= fecha);
  return (antes.length ? antes[antes.length - 1] : vivos[0]).kg;
}

/** Peso apuntado en esa fecha o antes; null si no hay ninguno tan antiguo (sin rellenar con el primero). */
export function pesoHasta(pesos: PesoCorporal[], fecha: string): number | null {
  const antes = pesosVivos(pesos).filter((p) => p.fecha <= fecha);
  return antes.length ? antes[antes.length - 1].kg : null;
}

export const fuerzaRelativa = (kg: number, peso: number) => Math.round((kg / peso) * 100) / 100;

const menosDias = (fecha: string, dias: number) => new Date(Date.parse(fecha) - dias * 864e5).toISOString().slice(0, 10);

/** Cuánto ha cambiado el peso desde hace `dias` (contando desde la última pesada). null si no hay pesada tan antigua. */
export function cambioPeso(pesos: PesoCorporal[], dias: number): number | null {
  const vivos = pesosVivos(pesos);
  if (vivos.length < 2) return null;
  const ult = vivos[vivos.length - 1];
  const antes = pesoHasta(vivos, menosDias(ult.fecha, dias));
  return antes == null ? null : Math.round((ult.kg - antes) * 10) / 10;
}

/** Primera, última, mínima y máxima de las pesadas. */
export function resumenPeso(pesos: PesoCorporal[]) {
  const vivos = pesosVivos(pesos);
  if (!vivos.length) return null;
  const kgs = vivos.map((p) => p.kg);
  return { primero: vivos[0], ultimo: vivos[vivos.length - 1], min: Math.min(...kgs), max: Math.max(...kgs), n: vivos.length };
}

/** Mejor 1RM estimado del ejercicio con las sesiones hasta `fecha` (incluida); sin fecha, con todas. */
export function mejor1RM(sesiones: Sesion[], id: string, fecha?: string): number | null {
  const ses = fecha ? sesiones.filter((s) => s.fecha <= fecha) : sesiones;
  const r = [...recordsPorReps(ses, id).values()].filter((m) => esFiable(m.reps));
  return r.reduce<number | null>((a, m) => Math.max(a ?? 0, e1rm(m.kg, m.reps)), null);
}

export interface Relativa { id: string; ahora: number; antes: number | null }

/** Fuerza relativa (1RM est. ÷ peso) de cada ejercicio, hoy y hace `dias` (si había marca y pesada entonces). */
export function fuerzaRelativaEjercicios(sesiones: Sesion[], pesos: PesoCorporal[], ids: string[], hoy: string, dias = 183): Relativa[] {
  const peso = pesoEn(pesos, hoy);
  if (peso == null) return [];
  const corte = menosDias(hoy, dias);
  const pesoAntes = pesoHasta(pesos, corte);
  const res: Relativa[] = [];
  for (const id of ids) {
    const rm = mejor1RM(sesiones, id);
    if (rm == null) continue;
    const rmAntes = mejor1RM(sesiones, id, corte);
    res.push({ id, ahora: fuerzaRelativa(rm, peso), antes: rmAntes != null && pesoAntes != null ? fuerzaRelativa(rmAntes, pesoAntes) : null });
  }
  return res;
}
