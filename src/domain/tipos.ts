import type { Carrera, Sesion } from './types';
import { entrada } from './catalogo';

export type TipoEntreno = 'pierna' | 'torso' | 'halterofilia' | 'calistenia' | 'metcon' | 'carrera';

/** Orden fijo de la leyenda y colores validados (dataviz, todos los pares: CVD ΔE ≥ 8,9; normal ≥ 16,7).
 * Amarillo y rosa quedan por debajo de 3:1 sobre el fondo: van siempre con leyenda y con el detalle del día. */
export const TIPOS: { id: TipoEntreno; nombre: string; color: string }[] = [
  { id: 'pierna', nombre: 'Pierna', color: '#14a37a' },
  { id: 'torso', nombre: 'Torso', color: '#e0581f' },
  { id: 'halterofilia', nombre: 'Halterofilia', color: '#e0a100' },
  { id: 'calistenia', nombre: 'Calistenia', color: '#7d3fb8' },
  { id: 'metcon', nombre: 'Metcon', color: '#ec8fc0' },
  { id: 'carrera', nombre: 'Carrera', color: '#3a7fd9' },
];
export const colorTipo = (t: TipoEntreno) => TIPOS.find((x) => x.id === t)!.color;
export const nombreTipo = (t: TipoEntreno) => TIPOS.find((x) => x.id === t)!.nombre;

const CALISTENIA = new Set(['dominadas', 'dips', 'push-ups']);
const EXCEPCIONES: Record<string, TipoEntreno> = { 'kb-swing': 'pierna', 'farmer-carry': 'pierna', 'db-snatch': 'halterofilia', 'db-clean-jerk': 'halterofilia' };

export function tipoEjercicio(id: string): TipoEntreno | null {
  if (CALISTENIA.has(id)) return 'calistenia';
  if (EXCEPCIONES[id]) return EXCEPCIONES[id];
  switch (entrada(id)?.grupo) {
    case 'Sentadilla': case 'Peso muerto y bisagra': case 'Zancadas': return 'pierna';
    case 'Empuje': case 'Tirón': return 'torso';
    case 'Halterofilia': return 'halterofilia';
    case 'Kettlebell y mancuerna': return 'pierna';
    default: return null;
  }
}

export function tiposDeSesion(s: Sesion): TipoEntreno[] {
  const t = new Set<TipoEntreno>();
  for (const f of s.fuerza) { const x = tipoEjercicio(f.ejercicio); if (x) t.add(x); }
  if (s.metcon) t.add('metcon');
  return TIPOS.map((x) => x.id).filter((x) => t.has(x));
}

/** Tipos de entreno de cada día (únicos y en el orden de TIPOS). */
export function tiposPorDia(sesiones: Sesion[], carreras: Carrera[]): Map<string, TipoEntreno[]> {
  const m = new Map<string, Set<TipoEntreno>>();
  const add = (d: string, t: TipoEntreno) => { if (!m.has(d)) m.set(d, new Set()); m.get(d)!.add(t); };
  for (const s of sesiones) if (!s.borrado) for (const t of tiposDeSesion(s)) add(s.fecha, t);
  for (const c of carreras) if (!c.borrado) add(c.fecha, 'carrera');
  return new Map([...m].map(([d, set]) => [d, TIPOS.map((x) => x.id).filter((x) => set.has(x))]));
}

export interface Reparto { tipo: TipoEntreno; dias: number; kg?: number; km?: number }

/** Días por tipo en las últimas `semanas` semanas (hasta hoy), con kg movidos (series × reps) o km de carrera. */
export function repartoPorTipo(sesiones: Sesion[], carreras: Carrera[], hoy: string, semanas = 4): Reparto[] {
  const desde = new Date(Date.parse(`${hoy}T00:00:00Z`) - semanas * 7 * 864e5).toISOString().slice(0, 10);
  const dentro = (f: string) => f > desde && f <= hoy;
  const dias = new Map<TipoEntreno, Set<string>>(TIPOS.map((t) => [t.id, new Set()]));
  const kg = new Map<TipoEntreno, number>(TIPOS.map((t) => [t.id, 0]));
  for (const s of sesiones) {
    if (s.borrado || !dentro(s.fecha)) continue;
    for (const t of tiposDeSesion(s)) dias.get(t)!.add(s.fecha);
    for (const f of s.fuerza) {
      const t = tipoEjercicio(f.ejercicio); if (!t) continue;
      kg.set(t, kg.get(t)! + f.series.reduce((a, x, i) => a + x * (f.repsSeries?.[i] ?? f.reps ?? 0), 0));
    }
  }
  let km = 0;
  for (const c of carreras) if (!c.borrado && dentro(c.fecha)) { dias.get('carrera')!.add(c.fecha); km += c.distanciaKm; }
  return TIPOS.map(({ id }) => id === 'carrera' ? { tipo: id, dias: dias.get(id)!.size, km: Math.round(km * 10) / 10 }
    : id === 'metcon' ? { tipo: id, dias: dias.get(id)!.size } : { tipo: id, dias: dias.get(id)!.size, kg: Math.round(kg.get(id)!) });
}
