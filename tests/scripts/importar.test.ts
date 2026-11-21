import { importar, corregirDecimales, inferirEjercicio } from '../../scripts/importar-notion';
import { existsSync, readFileSync } from 'node:fs';
import { EJERCICIOS_BASE } from '../../src/store/local';

// Los export de Notion son datos personales: solo existen en local, no en el repo público.
const RUTA = 'scripts/notion/export/';
const hayExport = existsSync(RUTA + 'fuerza.json');
const leer = (f: string) => (hayExport ? JSON.parse(readFileSync(RUTA + f, 'utf8')) : { filas: [] });
const fuerza = leer('fuerza.json');
const sesiones = leer('sesiones.json');
const d = importar(fuerza, sesiones);
const conExport = hayExport ? test : test.skip;
const ids = new Set(EJERCICIOS_BASE.map((e) => e.id));

test('corregirDecimales arregla 425 → 42.5', () =>
  expect(corregirDecimales([425, 45, 475, 525, 55])).toEqual([42.5, 45, 47.5, 52.5, 55]));
test('inferirEjercicio por el título', () => {
  expect(inferirEjercicio('Peso muerto 135 x 5')).toBe('deadlift');
  expect(inferirEjercicio('Algo raro')).toBeNull();
});
conExport('todas las sesiones de Notion con fecha están', () => {
  const fechas = new Set(d.sesiones.map((s) => s.fecha));
  for (const [, f] of (sesiones as any).filas) if (f) expect(fechas.has(f)).toBe(true);
});
conExport('todas las fechas son válidas y ordenadas', () => {
  for (const s of d.sesiones) expect(s.fecha).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  const f = d.sesiones.map((s) => s.fecha);
  expect([...f].sort()).toEqual(f);
});
conExport('ninguna fuerza vacía y ejercicios conocidos', () => {
  for (const s of d.sesiones) for (const x of s.fuerza) {
    expect(x.series.length).toBeGreaterThan(0);
    expect(ids.has(x.ejercicio)).toBe(true);
  }
});
conExport('se importan todas las fuerzas con series y fecha resoluble', () => {
  const fechaSesion = new Map((sesiones as any).filas.map((r: any[]) => [r[0], r[1]]));
  const esperadas = (fuerza as any).filas.filter((r: any[]) =>
    r.slice(4, 10).some((x: any) => x != null) && (r[0] || r[11].some((id: string) => fechaSesion.get(id)))).length;
  const n = d.sesiones.reduce((a, s) => a + s.fuerza.length, 0);
  expect(esperadas).toBeGreaterThan(160);
  expect(n).toBe(esperadas);
});
conExport('ejemplos concretos', () => {
  const s = d.sesiones.find((x) => x.fecha === '2026-06-18')!;
  expect(s.fuerza[0]).toMatchObject({ ejercicio: 'back-squat', reps: 5, series: [74, 79, 84, 89, 94], tempo: '4s+pausa' });
  const sp = d.sesiones.find((x) => x.fecha === '2026-10-20')!;
  expect(sp.fuerza[0]).toMatchObject({ ejercicio: 'shoulder-press', variante: 'btn', reps: 6, series: [34, 38, 42] });
  const casa = d.sesiones.find((x) => x.fecha === '2024-01-12')!;
  expect(casa.lugar).toBe('casa');
  const sinReps = d.sesiones.find((x) => x.fecha === '2025-11-11')!;
  expect(sinReps.fuerza[0].reps).toBe(8);
});
conExport('ids estables con prefijo n-', () => expect(d.sesiones.every((s) => s.id.startsWith('n-'))).toBe(true));
