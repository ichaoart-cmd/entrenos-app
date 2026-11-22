import { serieProgreso } from '../../src/domain/progreso';
import { sesion } from '../fixtures/sesiones';

test('una entrada por sesión con la serie top, sus reps y el 1RM estimado, en orden', () => {
  const s = serieProgreso([
    sesion('b', '2026-06-18', 'back-squat', 5, [74, 94]),
    sesion('a', '2026-06-11', 'back-squat', 5, [72, 92]),
    sesion('x', '2026-06-12', 'deadlift', 5, [130]),
    sesion('z', '2026-06-13', 'back-squat', 5, [200], { borrado: true }),
  ], 'back-squat');
  expect(s.map((p) => [p.fecha, p.kg, p.reps])).toEqual([['2026-06-11', 92, 5], ['2026-06-18', 94, 5]]);
  expect(s[1].e1rm).toBeCloseTo(107.7, 1);
});
test('ignora registros sin reps', () => {
  expect(serieProgreso([sesion('a', '2026-06-11', 'back-squat', null as any, [92])], 'back-squat')).toEqual([]);
});
