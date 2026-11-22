/**
 * Convierte el export de Notion (scripts/notion/export/*.json) en data/entrenos.json.
 * Uso: npm run importar > data/entrenos.json
 */
import type { Datos, Fuerza, Sesion } from '../src/domain/types';
import { normalizarReps } from '../src/domain/reps';
import { EJERCICIOS_BASE } from '../src/store/local';
import { corregirEjercicio, extraerReps, extraerRepsSeries, extraerVariante, normalizarEjercicio, normalizarTempo } from './notion/parsers';

type FilaFuerza = [string | null, string | null, string, number | null, ...(number | null)[]];
interface ExportFuerza { columnas: string[]; filas: any[][] }
interface ExportSesiones { columnas: string[]; filas: [string, string | null, string | null][] }

const ACTUALIZADO = '2026-11-21T00:00:00.000Z';

/** Corrige valores escritos sin coma (425 → 42.5) cuando son muy superiores al resto de series. */
export function corregirDecimales(series: number[]): number[] {
  return series.map((v, i) => {
    const otros = series.filter((_, j) => j !== i && series[j] > 0);
    if (!otros.length) return v;
    const min = Math.min(...otros);
    return v >= 100 && v > min * 3 && v / 10 >= min * 0.5 && v / 10 <= min * 2 ? v / 10 : v;
  });
}

export function inferirEjercicio(titulo: string): string | null {
  const t = titulo.toLowerCase();
  if (/peso muerto|deadlift/.test(t)) return 'deadlift';
  if (/front/.test(t)) return 'front-squat';
  if (/back|bsq/.test(t)) return 'back-squat';
  if (/banca|bench/.test(t)) return 'press-banca';
  if (/shoulder|hombro/.test(t)) return 'shoulder-press';
  return null;
}

export function importar(fuerza: ExportFuerza, sesiones: ExportSesiones): Datos {
  const porId = new Map<string, Sesion>();
  const porFecha = new Map<string, Sesion>();
  const nueva = (id: string, fecha: string, nombre: string | null): Sesion => {
    const s: Sesion = {
      id: `n-${id}`, actualizado: ACTUALIZADO, fecha,
      lugar: nombre && /^casa/i.test(nombre) ? 'casa' : 'box', fuerza: [],
    };
    porFecha.set(fecha, s);
    return s;
  };
  for (const [id, fecha, nombre] of sesiones.filas) {
    if (!fecha) continue;
    porId.set(id, porFecha.get(fecha) ?? nueva(id, fecha, nombre));
  }
  const fechaDe = new Map(sesiones.filas.map(([id, f]) => [id, f]));

  fuerza.filas.forEach((fila, i) => {
    const [fecha, sel, nombre, reps, ...resto] = fila as FilaFuerza;
    const series = corregirDecimales((resto.slice(0, 6) as (number | null)[]).filter((x): x is number => x != null));
    const tempoTxt = resto[6] as unknown as string | null;
    const relaciones = (resto[7] as unknown as string[]) ?? [];
    if (!series.length) return;
    const rel = relaciones.map((id) => porId.get(id)).find(Boolean);
    const relFecha = relaciones.map((id) => fechaDe.get(id)).find(Boolean) ?? null;
    let sesion = rel ?? (fecha ? porFecha.get(fecha) : undefined);
    if (!sesion) {
      const f = fecha ?? relFecha;
      if (!f) return;
      sesion = porFecha.get(f) ?? nueva(`f${i}`, f, 'Box');
    }
    const base = normalizarEjercicio(sel) ?? inferirEjercicio(nombre);
    const ejercicio = base && corregirEjercicio(base, nombre);
    if (!ejercicio) { sesion.nota = [sesion.nota, nombre].filter(Boolean).join(' · '); return; }
    const repsSeries = extraerRepsSeries(nombre, series.length);
    const f: Fuerza = normalizarReps({ ejercicio, reps: reps ?? extraerReps(nombre), series, ...(repsSeries ? { repsSeries } : {}) });
    const variante = extraerVariante(nombre);
    const tempo = normalizarTempo(tempoTxt);
    if (variante) f.variante = variante;
    if (tempo) f.tempo = tempo;
    if (nombre && !/^\s*$/.test(nombre)) f.nota = nombre;
    sesion.fuerza.push(f);
  });

  const lista = [...new Set(porFecha.values())].sort((a, b) => (a.fecha === b.fecha ? a.id.localeCompare(b.id) : a.fecha.localeCompare(b.fecha)));
  return { version: 1, ejercicios: [...EJERCICIOS_BASE].sort((a, b) => a.id.localeCompare(b.id)), sesiones: lista, carreras: [] };
}

const esPrincipal = typeof process !== 'undefined' && process.argv[1]?.endsWith('importar-notion.ts');
if (esPrincipal) {
  const { readFileSync } = await import('node:fs');
  const leer = (p: string) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
  const datos = importar(leer('./notion/export/fuerza.json'), leer('./notion/export/sesiones.json'));
  process.stdout.write(JSON.stringify(datos, null, 2) + '\n');
}
