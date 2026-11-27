import type { FormatoMetcon, Metcon, Sesion, TipoResultado } from './types';

export interface Benchmark { id: string; nombre: string; formato: FormatoMetcon; duracionMin?: number; descripcion: string; movimientos: string[] }

/** WODs de referencia de CrossFit. Pesos RX hombre/mujer. */
export const BENCHMARKS: Benchmark[] = [
  { id: 'fran', nombre: 'Fran', formato: 'ForTime', descripcion: '21-15-9: thrusters (43/30 kg) y dominadas', movimientos: ['thruster', 'dominadas'] },
  { id: 'grace', nombre: 'Grace', formato: 'ForTime', descripcion: '30 clean & jerk (61/43 kg)', movimientos: ['clean-jerk'] },
  { id: 'isabel', nombre: 'Isabel', formato: 'ForTime', descripcion: '30 snatch (61/43 kg)', movimientos: ['snatch'] },
  { id: 'diane', nombre: 'Diane', formato: 'ForTime', descripcion: '21-15-9: peso muerto (102/70 kg) y HSPU', movimientos: ['peso-muerto', 'hspu'] },
  { id: 'elizabeth', nombre: 'Elizabeth', formato: 'ForTime', descripcion: '21-15-9: clean (61/43 kg) y fondos en anillas', movimientos: ['clean', 'fondos-anillas'] },
  { id: 'helen', nombre: 'Helen', formato: 'ForTime', descripcion: '3 rondas: 400 m carrera, 21 KB swing (24/16 kg), 12 dominadas', movimientos: ['carrera', 'kb-swing', 'dominadas'] },
  { id: 'jackie', nombre: 'Jackie', formato: 'ForTime', descripcion: '1000 m remo, 50 thrusters (20/15 kg), 30 dominadas', movimientos: ['remo', 'thruster', 'dominadas'] },
  { id: 'karen', nombre: 'Karen', formato: 'ForTime', descripcion: '150 wall balls (9/6 kg)', movimientos: ['wall-ball'] },
  { id: 'annie', nombre: 'Annie', formato: 'ForTime', descripcion: '50-40-30-20-10: dobles de comba y abdominales', movimientos: ['comba', 'abdominales'] },
  { id: 'nancy', nombre: 'Nancy', formato: 'ForTime', descripcion: '5 rondas: 400 m carrera, 15 overhead squat (43/30 kg)', movimientos: ['carrera', 'snatch'] },
  { id: 'kelly', nombre: 'Kelly', formato: 'ForTime', descripcion: '5 rondas: 400 m carrera, 30 box jumps, 30 wall balls', movimientos: ['carrera', 'box-jump', 'wall-ball'] },
  { id: 'murph', nombre: 'Murph', formato: 'ForTime', descripcion: '1,6 km carrera, 100 dominadas, 200 flexiones, 300 sentadillas, 1,6 km carrera (chaleco 9/6 kg)', movimientos: ['carrera', 'dominadas', 'flexiones', 'sentadilla-aire'] },
  { id: 'cindy', nombre: 'Cindy', formato: 'AMRAP', duracionMin: 20, descripcion: 'AMRAP 20 min: 5 dominadas, 10 flexiones, 15 sentadillas', movimientos: ['dominadas', 'flexiones', 'sentadilla-aire'] },
];

/** Movimientos de Metcon, con su ilustración (public/ilustraciones). */
export const MOVIMIENTOS: { id: string; nombre: string; ilustracion: string }[] = [
  { id: 'dominadas', nombre: 'Dominadas', ilustracion: 'dominadas' },
  { id: 'burpees', nombre: 'Burpees', ilustracion: 'burpee' },
  { id: 'flexiones', nombre: 'Flexiones', ilustracion: 'burpee' },
  { id: 'box-jump', nombre: 'Box jump', ilustracion: 'box-jump' },
  { id: 'comba', nombre: 'Comba', ilustracion: 'comba' },
  { id: 'wall-ball', nombre: 'Wall ball', ilustracion: 'wall-ball' },
  { id: 'remo', nombre: 'Remo', ilustracion: 'remo-ergo' },
  { id: 'carrera', nombre: 'Carrera', ilustracion: 'correr' },
  { id: 'kb-swing', nombre: 'KB swing', ilustracion: 'kb-swing' },
  { id: 'thruster', nombre: 'Thruster', ilustracion: 'thruster' },
  { id: 'sentadilla-aire', nombre: 'Sentadillas', ilustracion: 'sentadilla' },
  { id: 'peso-muerto', nombre: 'Peso muerto', ilustracion: 'peso-muerto' },
  { id: 'clean', nombre: 'Clean', ilustracion: 'clean' },
  { id: 'clean-jerk', nombre: 'Clean & jerk', ilustracion: 'split-jerk' },
  { id: 'snatch', nombre: 'Snatch / OHS', ilustracion: 'overhead' },
  { id: 'hspu', nombre: 'HSPU / pino', ilustracion: 'pino' },
  { id: 'cuerda', nombre: 'Cuerda', ilustracion: 'cuerda' },
  { id: 'fondos-anillas', nombre: 'Anillas', ilustracion: 'anillas' },
  { id: 'abdominales', nombre: 'Abdominales', ilustracion: 'burpee' },
  { id: 'press-banca-manc', nombre: 'Press banca manc.', ilustracion: 'press-banca' },
  { id: 'goblet-squat', nombre: 'Goblet squat', ilustracion: 'sentadilla' },
  { id: 'zancadas', nombre: 'Zancadas', ilustracion: 'zancada' },
  { id: 'db-snatch', nombre: 'DB snatch', ilustracion: 'overhead' },
  { id: 'push-press', nombre: 'Push press / jerk', ilustracion: 'press-hombro' },
  { id: 'devil-press', nombre: 'Devil press', ilustracion: 'burpee' },
  { id: 'toes-to-bar', nombre: 'Toes to bar', ilustracion: 'dominadas' },
  { id: 'bici-ski', nombre: 'Bici / ski', ilustracion: 'remo-ergo' },
];

/** Número para comparar: segundos (tiempo) o rondas×1000+reps. null si no se entiende. */
export function valorComparable(r: NonNullable<Metcon['resultado']>): number | null {
  if (r.tipo === 'tiempo') {
    const p = r.valor.trim().split(':').map((x) => Number(x));
    if (!p.length || p.some((x) => !Number.isFinite(x))) return null;
    return p.reduce((a, x) => a * 60 + x, 0);
  }
  if (r.tipo === 'rondas+reps') {
    const [ro, re = 0] = r.valor.split('+').map(Number);
    return Number.isFinite(ro) && Number.isFinite(re) ? ro * 1000 + re : null;
  }
  const n = Number(r.valor);
  return Number.isFinite(n) ? n : null;
}

/** ¿a mejora a b? En tiempo, menos es mejor; en lo demás, más. */
export const esMejor = (tipo: TipoResultado, a: number, b: number) => (tipo === 'tiempo' ? a < b : a > b);

export interface MarcaBenchmark { fecha: string; valor: string; rx: boolean; tipo: TipoResultado; n: number }

export function historialBenchmark(sesiones: Sesion[], id: string): MarcaBenchmark[] {
  const r: MarcaBenchmark[] = [];
  for (const s of sesiones) {
    const m = s.metcon;
    if (s.borrado || m?.benchmark !== id || !m.resultado) continue;
    const n = valorComparable(m.resultado);
    if (n != null) r.push({ fecha: s.fecha, valor: m.resultado.valor, rx: m.rx !== false, tipo: m.resultado.tipo, n });
  }
  return r.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Mejor marca; si hay alguna RX, la mejor de las RX. */
export function mejorBenchmark(sesiones: Sesion[], id: string): MarcaBenchmark | null {
  const h = historialBenchmark(sesiones, id);
  const pool = h.some((x) => x.rx) ? h.filter((x) => x.rx) : h;
  return pool.reduce<MarcaBenchmark | null>((a, x) => (!a || esMejor(x.tipo, x.n, a.n) ? x : a), null);
}
