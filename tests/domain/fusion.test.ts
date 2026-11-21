import { fusionar } from '../../src/domain/fusion';
import type { Datos, Sesion } from '../../src/domain/types';
import { sesion } from '../fixtures/sesiones';

const d = (sesiones: Sesion[]): Datos => ({ version: 1, ejercicios: [], sesiones, carreras: [] });
const con = (s: Sesion, actualizado: string, extra: Partial<Sesion> = {}): Sesion => ({ ...s, actualizado, ...extra });

test('une sesiones distintas', () => {
  const r = fusionar(d([sesion('a', '2026-01-01', 'deadlift', 5, [100])]), d([sesion('b', '2026-01-02', 'deadlift', 5, [105])]));
  expect(r.sesiones.map((s) => s.id).sort()).toEqual(['a', 'b']);
});
test('mismo id: gana la más reciente', () => {
  const base = sesion('a', '2026-01-01', 'deadlift', 5, [100]);
  const local = con({ ...base, fuerza: [{ ejercicio: 'deadlift', reps: 5, series: [110] }] }, '2026-01-03T00:00:00Z');
  const remoto = con(base, '2026-01-02T00:00:00Z');
  expect(fusionar(d([local]), d([remoto])).sesiones[0].fuerza[0].series).toEqual([110]);
  expect(fusionar(d([remoto]), d([local])).sesiones[0].fuerza[0].series).toEqual([110]);
});
test('tombstone remoto más reciente borra el local', () => {
  const base = sesion('a', '2026-01-01', 'deadlift', 5, [100]);
  const r = fusionar(d([con(base, '2026-01-02T00:00:00Z')]), d([con(base, '2026-01-03T00:00:00Z', { borrado: true })]));
  expect(r.sesiones[0].borrado).toBe(true);
});
test('idempotente', () => {
  const a = d([sesion('a', '2026-01-01', 'deadlift', 5, [100]), sesion('b', '2026-01-02', 'deadlift', 5, [105])]);
  expect(fusionar(a, a)).toEqual(a);
});
test('une ejercicios por id', () => {
  const a: Datos = { ...d([]), ejercicios: [{ id: 'x', nombre: 'X', grupo: '' }] };
  const b: Datos = { ...d([]), ejercicios: [{ id: 'y', nombre: 'Y', grupo: '' }] };
  expect(fusionar(a, b).ejercicios.map((e) => e.id).sort()).toEqual(['x', 'y']);
});
