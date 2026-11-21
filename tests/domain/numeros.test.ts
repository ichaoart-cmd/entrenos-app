import { parsearKg, redondear05 } from '../../src/domain/numeros';

test('parsearKg-acepta-coma', () => {
  expect(parsearKg('82,5')).toBe(82.5);
  expect(parsearKg('94')).toBe(94);
  expect(parsearKg('abc')).toBeNull();
  expect(parsearKg('')).toBeNull();
});
test('redondear05', () => {
  expect(redondear05(84.26)).toBe(84.5);
  expect(redondear05(84.2)).toBe(84);
});
