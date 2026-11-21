import type { Datos } from './types';

/** Copia de seguridad completa. Solo incluye los datos de entrenamiento (nunca ajustes ni token). */
export function exportarJSON(d: Datos): string {
  return JSON.stringify({ version: d.version, ejercicios: d.ejercicios, sesiones: d.sesiones, carreras: d.carreras }, null, 2);
}

const celda = (v: unknown) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** Una fila por bloque de fuerza (serie top); las sesiones solo de Metcon salen con la fuerza vacía. */
export function exportarCSV(d: Datos): string {
  const filas = [['fecha', 'ejercicio', 'variante', 'reps', 'kg', 'tempo', 'metcon_formato', 'metcon_resultado']];
  for (const s of d.sesiones) {
    if (s.borrado) continue;
    const m = [s.metcon?.formato, s.metcon?.resultado?.valor];
    if (!s.fuerza.length) filas.push([s.fecha, '', '', '', '', '', ...m] as string[]);
    for (const f of s.fuerza) {
      filas.push([s.fecha, f.ejercicio, f.variante, f.reps, f.series.length ? Math.max(...f.series) : '', f.tempo, ...m] as string[]);
    }
  }
  return filas.map((f) => f.map(celda).join(',')).join('\n') + '\n';
}
