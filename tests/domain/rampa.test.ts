import { generarRampa } from '../../src/domain/rampa';

test('rampa repite el salto de la vez anterior', () => {
  expect(generarRampa(96, [74, 79, 84, 89, 94])).toEqual([76, 81, 86, 91, 96]);
});
test('rampa respeta el número de series anterior', () => {
  expect(generarRampa(132, [110, 120, 130])).toEqual([112, 122, 132]);
});
test('rampa sin historial: 5 series desde el 80 %', () => {
  expect(generarRampa(100)).toEqual([80, 85, 90, 95, 100]);
});
test('rampa con historial de una sola serie usa la regla del 80 %', () => {
  expect(generarRampa(100, [100])).toEqual([80, 85, 90, 95, 100]);
});
test('la última serie es exactamente la top aunque no sea múltiplo de 0,5', () => {
  expect(generarRampa(82.3).at(-1)).toBe(82.3);
});

test('rampa con número de series elegido conserva el salto anterior', () => {
  expect(generarRampa(96, [74, 79, 84, 89, 94], 3)).toEqual([86, 91, 96]);
});
test('rampa sin historial con 3 series', () => {
  expect(generarRampa(100, undefined, 3)).toEqual([80, 90, 100]);
});
