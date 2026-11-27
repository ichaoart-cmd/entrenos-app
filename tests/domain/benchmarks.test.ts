import { BENCHMARKS, MOVIMIENTOS, valorComparable, mejorBenchmark, historialBenchmark, esMejor } from '../../src/domain/benchmarks';
import type { Metcon, Sesion } from '../../src/domain/types';

const ses = (fecha: string, m: Metcon): Sesion => ({ id: fecha, actualizado: '', fecha, lugar: 'box', fuerza: [], metcon: m });
const fran = (valor: string, rx = true): Metcon => ({ formato: 'ForTime', benchmark: 'fran', rx, resultado: { tipo: 'tiempo', valor } });

test('catálogo de benchmarks y movimientos', () => {
  expect(BENCHMARKS.find((b) => b.id === 'fran')).toMatchObject({ nombre: 'Fran', formato: 'ForTime' });
  expect(BENCHMARKS.find((b) => b.id === 'cindy')).toMatchObject({ formato: 'AMRAP', duracionMin: 20 });
  expect(MOVIMIENTOS.find((m) => m.id === 'wall-ball')?.ilustracion).toBe('wall-ball');
});
test('valores comparables: tiempo menor es mejor, rondas mayor es mejor', () => {
  expect(valorComparable({ tipo: 'tiempo', valor: '5:40' })).toBe(340);
  expect(valorComparable({ tipo: 'tiempo', valor: '1:02:05' })).toBe(3725);
  expect(valorComparable({ tipo: 'rondas+reps', valor: '18+7' })).toBe(18007);
  expect(valorComparable({ tipo: 'tiempo', valor: 'rápido' })).toBeNull();
  expect(esMejor('tiempo', 340, 372)).toBe(true);
  expect(esMejor('rondas+reps', 18007, 17020)).toBe(true);
});
test('mejor marca: prefiere RX; historial ordenado', () => {
  const s = [ses('2026-01-10', fran('6:12')), ses('2026-03-01', fran('5:40')), ses('2026-04-01', fran('4:50', false)), ses('2026-05-01', { formato: 'AMRAP' })];
  expect(mejorBenchmark(s, 'fran')).toMatchObject({ fecha: '2026-03-01', valor: '5:40', rx: true });
  expect(historialBenchmark(s, 'fran').map((h) => h.valor)).toEqual(['6:12', '5:40', '4:50']);
  expect(mejorBenchmark(s, 'grace')).toBeNull();
});

test('hay press banca con mancuernas y goblet squat para el Metcon, sin ids repetidos', () => {
  expect(MOVIMIENTOS.find((m) => m.id === 'press-banca-manc')?.ilustracion).toBe('press-banca');
  expect(MOVIMIENTOS.find((m) => m.id === 'goblet-squat')).toBeTruthy();
  expect(new Set(MOVIMIENTOS.map((m) => m.id)).size).toBe(MOVIMIENTOS.length);
});
