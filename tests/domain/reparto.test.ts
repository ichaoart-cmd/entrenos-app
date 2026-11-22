import { repartoPorTipo } from '../../src/domain/tipos';
import type { Carrera, Sesion } from '../../src/domain/types';

const ses = (fecha: string, ej: string, series: number[], reps = 5, metcon = false): Sesion =>
  ({ id: fecha + ej, actualizado: '', fecha, lugar: 'box', fuerza: [{ ejercicio: ej, reps, series }], ...(metcon ? { metcon: { formato: 'AMRAP' } } : {}) });
const run = (fecha: string, km: number): Carrera => ({ id: 'c' + fecha, actualizado: '', fecha, distanciaKm: km, tiempoSeg: 1800 });

test('reparto de las últimas 4 semanas: días por tipo, kg movidos y km', () => {
  const r = repartoPorTipo([ses('2026-11-20', 'back-squat', [80, 90]), ses('2026-11-10', 'deadlift', [100], 3, true), ses('2026-10-01', 'press-banca', [60])],
    [run('2026-11-15', 8), run('2026-11-18', 5)], '2026-11-22', 4);
  expect(r.find((x) => x.tipo === 'pierna')).toEqual({ tipo: 'pierna', dias: 2, kg: 80 * 5 + 90 * 5 + 300 });
  expect(r.find((x) => x.tipo === 'metcon')).toMatchObject({ dias: 1 });
  expect(r.find((x) => x.tipo === 'torso')).toMatchObject({ dias: 0, kg: 0 });
  expect(r.find((x) => x.tipo === 'carrera')).toMatchObject({ dias: 2, km: 13 });
  expect(r.map((x) => x.tipo)).toEqual(['pierna', 'torso', 'halterofilia', 'calistenia', 'metcon', 'carrera']);
});
