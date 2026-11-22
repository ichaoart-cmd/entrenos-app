import { componerTempo, partirTempo } from '../../src/domain/tempo';

test('componer tempo', () => {
  expect(componerTempo(4, true)).toBe('4s+pausa');
  expect(componerTempo(3, false)).toBe('3s');
  expect(componerTempo(null, true)).toBe('sin tempo');
});
test('partir tempo', () => {
  expect(partirTempo('4s+pausa')).toEqual({ seg: 4, pausa: true });
  expect(partirTempo('3s')).toEqual({ seg: 3, pausa: false });
  expect(partirTempo('sin tempo')).toEqual({ seg: null, pausa: false });
  expect(partirTempo(undefined)).toEqual({ seg: null, pausa: false });
});
