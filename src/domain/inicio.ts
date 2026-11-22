import type { Carrera, Sesion } from './types';
import { BENCHMARKS, historialBenchmark, mejorBenchmark } from './benchmarks';
import { diasConRecord } from './records';

const dias = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const BASICOS = ['back-squat', 'press-banca', 'shoulder-press', 'deadlift', 'front-squat', 'snatch', 'clean'];

/** Los `n` ejercicios que más haces: primero por veces en los últimos 4 meses, luego por veces en total; si faltan, los básicos. */
export function ejerciciosHabituales(sesiones: Sesion[], hoy: string, n = 4) {
  const desde = new Date(Date.parse(`${hoy}T00:00:00Z`) - 120 * 864e5).toISOString().slice(0, 10);
  const info = new Map<string, { recientes: number; total: number; ultima: string; top: number }>();
  for (const s of sesiones) {
    if (s.borrado) continue;
    for (const f of s.fuerza) {
      if (!f.series.length) continue;
      const x = info.get(f.ejercicio) ?? { recientes: 0, total: 0, ultima: '', top: 0 };
      x.total++; if (s.fecha >= desde) x.recientes++;
      if (s.fecha >= x.ultima) { x.ultima = s.fecha; x.top = Math.max(...f.series); }
      info.set(f.ejercicio, x);
    }
  }
  const orden = [...info].sort(([, a], [, b]) => b.recientes - a.recientes || b.total - a.total || b.ultima.localeCompare(a.ultima)).map(([id]) => id);
  const ids = [...new Set([...orden, ...BASICOS])].slice(0, n);
  return ids.map((id) => {
    const x = info.get(id);
    return { id, dias: x ? dias(x.ultima, hoy) : null, top: x ? x.top : null };
  });
}

/** Un WOD de referencia distinto cada semana (lunes a domingo), con tu mejor marca y hace cuánto lo hiciste. */
export function retoSemanal(sesiones: Sesion[], hoy: string) {
  const d = new Date(`${hoy}T00:00:00Z`);
  const lunes = Date.parse(`${hoy}T00:00:00Z`) / 864e5 - ((d.getUTCDay() + 6) % 7);
  const benchmark = BENCHMARKS[Math.floor(lunes / 7) % BENCHMARKS.length];
  const h = historialBenchmark(sesiones, benchmark.id);
  return { benchmark, mejor: mejorBenchmark(sesiones, benchmark.id), diasDesde: h.length ? dias(h[h.length - 1].fecha, hoy) : null };
}

/** Lo entrenado hoy. */
export function entrenoDeHoy(sesiones: Sesion[], carreras: Carrera[], hoy: string) {
  const s = sesiones.filter((x) => !x.borrado && x.fecha === hoy);
  const c = carreras.filter((x) => !x.borrado && x.fecha === hoy);
  return { sesiones: s, carreras: c, record: diasConRecord(sesiones).has(hoy), vacio: !s.length && !c.length };
}
