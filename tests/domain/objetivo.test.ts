import { aplicarObjetivo, estadoSerie } from '../../src/domain/objetivo';

const obj = { series: [74, 79, 84, 89, 94], reps: [5, 5, 5, 5, 5] };

test('las series no tocadas siguen al objetivo y las tocadas conservan lo real', () => {
  const f = { ejercicio: 'back-squat', reps: 5, series: [74, 79, 84, 89, 90], repsSeries: [5, 5, 5, 5, 3] };
  const r = aplicarObjetivo(f, { series: [76, 81, 86, 91, 96], reps: [5, 5, 5, 5, 5] }, new Set([4]));
  expect(r.series).toEqual([76, 81, 86, 91, 90]);
  expect(r.repsSeries).toEqual([5, 5, 5, 5, 3]);
  expect(r.reps).toBe(5); // la serie más pesada real es la 4ª (91 kg × 5)
  expect(r.objetivo).toEqual({ series: [76, 81, 86, 91, 96], reps: [5, 5, 5, 5, 5] });
});
test('estado de cada serie frente a su objetivo', () => {
  expect(estadoSerie(94, 5, 94, 5)).toBe('cumplido');
  expect(estadoSerie(94, 3, 94, 5)).toBe('no-alcanzado');
  expect(estadoSerie(90, 5, 94, 5)).toBe('no-alcanzado');
  expect(estadoSerie(94, 6, 94, 5)).toBe('superado');
  expect(estadoSerie(96, 5, 94, 5)).toBe('superado');
});
test('sin series tocadas lo real es igual al objetivo', () => {
  const r = aplicarObjetivo({ ejercicio: 'x', reps: 5, series: [] }, obj, new Set());
  expect(r.series).toEqual(obj.series);
  expect(r.repsSeries).toBeUndefined(); // todas iguales → no se guarda el detalle
  expect(r.reps).toBe(5);
});
