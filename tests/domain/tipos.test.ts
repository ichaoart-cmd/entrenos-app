import { TIPOS, tipoEjercicio, tiposPorDia } from '../../src/domain/tipos';
import type { Carrera, Sesion } from '../../src/domain/types';

const ses = (fecha: string, ejercicios: string[], metcon = false, borrado = false): Sesion => ({
  id: fecha + ejercicios.join(), actualizado: '', fecha, lugar: 'box', borrado,
  fuerza: ejercicios.map((e) => ({ ejercicio: e, reps: 5, series: [50] })), ...(metcon ? { metcon: { formato: 'AMRAP' } } : {}),
});
const run = (fecha: string): Carrera => ({ id: 'c' + fecha, actualizado: '', fecha, distanciaKm: 5, tiempoSeg: 1500 });

test('cada ejercicio cae en su tipo', () => {
  expect(tipoEjercicio('back-squat')).toBe('pierna');
  expect(tipoEjercicio('deadlift')).toBe('pierna');
  expect(tipoEjercicio('walking-lunge')).toBe('pierna');
  expect(tipoEjercicio('kb-swing')).toBe('pierna');
  expect(tipoEjercicio('press-banca')).toBe('torso');
  expect(tipoEjercicio('remo-barra')).toBe('torso');
  expect(tipoEjercicio('snatch')).toBe('halterofilia');
  expect(tipoEjercicio('db-snatch')).toBe('halterofilia');
  expect(tipoEjercicio('dominadas')).toBe('calistenia');
  expect(tipoEjercicio('dips')).toBe('calistenia');
  expect(tipoEjercicio('inventado')).toBeNull();
});
test('tipos por día: únicos, en el orden de la leyenda, sin borrados', () => {
  const m = tiposPorDia([ses('2026-11-02', ['press-banca', 'back-squat'], true), ses('2026-11-03', ['snatch'], false, true)], [run('2026-11-02'), run('2026-11-04')]);
  expect(m.get('2026-11-02')).toEqual(['pierna', 'torso', 'metcon', 'carrera']);
  expect(m.has('2026-11-03')).toBe(false);
  expect(m.get('2026-11-04')).toEqual(['carrera']);
  expect(TIPOS.map((t) => t.id)).toEqual(['pierna', 'torso', 'halterofilia', 'calistenia', 'metcon', 'carrera']);
});
