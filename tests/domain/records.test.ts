import { recordsPorReps, detectarPR, ejercicioSugerido, ultimaFuerza, ROTACION } from '../../src/domain/records';
import { fx, sesionBorrada5x100 } from '../fixtures/sesiones';

test('récord por reps', () => {
  const r = recordsPorReps(fx, 'back-squat');
  expect(r.get(5)).toEqual({ reps: 5, kg: 94, fecha: '2026-06-18' });
  expect(r.get(8)?.kg).toBe(96);
});
test('PR nuevo', () =>
  expect(detectarPR({ ejercicio: 'back-squat', reps: 5, series: [76, 81, 86, 91, 96] }, '2026-11-21', fx))
    .toEqual({ reps: 5, kg: 96, anteriorKg: 94 }));
test('igualar no es PR', () =>
  expect(detectarPR({ ejercicio: 'back-squat', reps: 5, series: [94] }, '2026-11-21', fx)).toBeNull());
test('primer registro a unas reps es PR con anterior null', () =>
  expect(detectarPR({ ejercicio: 'back-squat', reps: 3, series: [100] }, '2026-11-21', fx)?.anteriorKg).toBeNull());
test('sin reps o sin series no hay PR', () => {
  expect(detectarPR({ ejercicio: 'back-squat', reps: null, series: [120] }, '2026-11-21', fx)).toBeNull();
  expect(detectarPR({ ejercicio: 'back-squat', reps: 5, series: [] }, '2026-11-21', fx)).toBeNull();
});
test('sugerido = el más antiguo de la rotación', () => expect(ejercicioSugerido(fx, ROTACION)).toBe('press-banca'));
test('sugerido entre hechos: el de fecha más antigua', () =>
  expect(ejercicioSugerido(fx, ['back-squat', 'shoulder-press', 'deadlift', 'front-squat'])).toBe('front-squat'));
test('ignora sesiones borradas', () => {
  const r = recordsPorReps([...fx, sesionBorrada5x100], 'back-squat');
  expect(r.get(5)?.kg).toBe(94);
});
test('ultimaFuerza devuelve la más reciente', () =>
  expect(ultimaFuerza(fx, 'back-squat')?.series).toEqual([74, 79, 84, 89, 94]));
