import { diasConRecord } from '../../src/domain/records';
import { sesion } from '../fixtures/sesiones';

test('marca los días en que se superó una marca previa del mismo ejercicio y reps', () => {
  const s = [
    sesion('a', '2026-06-04', 'back-squat', 5, [90]),
    sesion('b', '2026-06-11', 'back-squat', 5, [92]),
    sesion('c', '2026-06-18', 'back-squat', 5, [91]),
    sesion('d', '2026-06-20', 'deadlift', 5, [140]),
  ];
  expect([...diasConRecord(s)]).toEqual(['2026-06-11']);
});
