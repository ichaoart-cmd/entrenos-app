import { repsDeTop, normalizarReps } from '../../src/domain/reps';
import { recordsPorReps } from '../../src/domain/records';
import { sesion } from '../fixtures/sesiones';

test('las reps que cuentan son las de la serie más pesada', () => {
  expect(repsDeTop({ ejercicio: 'x', reps: 9, series: [85, 90, 95, 90, 85], repsSeries: [9, 7, 5, 7, 9] })).toBe(5);
  expect(repsDeTop({ ejercicio: 'x', reps: 5, series: [80, 90] })).toBe(5);
});
test('normalizarReps quita repsSeries si todas son iguales y fija reps a las de la top', () => {
  expect(normalizarReps({ ejercicio: 'x', reps: 3, series: [80, 90], repsSeries: [5, 5] })).toEqual({ ejercicio: 'x', reps: 5, series: [80, 90] });
  expect(normalizarReps({ ejercicio: 'x', reps: 3, series: [80, 90], repsSeries: [8, 5] })).toEqual({ ejercicio: 'x', reps: 5, series: [80, 90], repsSeries: [8, 5] });
});
test('los récords usan las reps de la serie más pesada', () => {
  const s = { ...sesion('p', '2025-05-19', 'back-squat', 9, [85, 90, 95, 90, 85]) };
  s.fuerza = [{ ...s.fuerza[0], repsSeries: [9, 7, 5, 7, 9] }];
  expect(recordsPorReps([s], 'back-squat').get(5)?.kg).toBe(95);
});
