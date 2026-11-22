import { repetirUltima } from '../../src/domain/objetivo';

test('repetir la última vez: lo que hiciste pasa a ser el objetivo y lo real empieza igual', () => {
  const f = repetirUltima({ ejercicio: 'back-squat', variante: 'barra alta', tempo: '3s', reps: 3, series: [80, 85, 90], repsSeries: [5, 5, 3], objetivo: { series: [80, 85, 92], reps: [5, 5, 5] }, nota: 'x' });
  expect(f).toEqual({ ejercicio: 'back-squat', variante: 'barra alta', tempo: '3s', reps: 3, series: [80, 85, 90], repsSeries: [5, 5, 3], objetivo: { series: [80, 85, 90], reps: [5, 5, 3] } });
});
