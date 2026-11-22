import type { Datos } from './types';
import { fusionar } from './fusion';

/** Copia de seguridad completa. Solo incluye los datos de entrenamiento (nunca ajustes ni token). */
export function exportarJSON(d: Datos): string {
  return JSON.stringify({ version: d.version, ejercicios: d.ejercicios, sesiones: d.sesiones, carreras: d.carreras, ...(d.pesos?.length ? { pesos: d.pesos } : {}) }, null, 2);
}

/** Suma una copia (texto JSON exportado) a los datos actuales; si un registro está en los dos, gana el más reciente. */
export function importarCopia(actual: Datos, texto: string): Datos {
  let c: Partial<Datos>;
  try { c = JSON.parse(texto); } catch { throw new Error('Ese archivo no es una copia de Entrenos.'); }
  if (!c || !Array.isArray(c.sesiones) || !Array.isArray(c.carreras)) throw new Error('Ese archivo no es una copia de Entrenos.');
  const copia: Datos = { version: 1, ejercicios: Array.isArray(c.ejercicios) ? c.ejercicios : [], sesiones: c.sesiones, carreras: c.carreras, ...(Array.isArray(c.pesos) ? { pesos: c.pesos } : {}) };
  return fusionar(actual, copia);
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
