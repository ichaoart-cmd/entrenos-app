import { e1rm, rmEstimado, esFiable } from '../../src/domain/rm';

test('1 rep = el propio peso', () => expect(e1rm(100, 1)).toBe(100));
test('media de Epley y Brzycki', () => expect(e1rm(94, 5)).toBeCloseTo(107.71, 1));
test('inversa: 5RM desde 1RM', () => expect(rmEstimado(107.71, 5)).toBeCloseTo(94, 0));
test('inversa de 1 rep = 1RM', () => expect(rmEstimado(107.71, 1)).toBe(107.71));
test('fiabilidad', () => { expect(esFiable(10)).toBe(true); expect(esFiable(12)).toBe(false); });
