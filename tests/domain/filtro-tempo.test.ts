import { conTempo, filtrarPorTempo } from '../../src/domain/progreso';
import type { Sesion } from '../../src/domain/types';

const s = (id: string, tempo?: string): Sesion => ({
  id, actualizado: '2024-01-01T00:00:00Z', fecha: '2026-01-0' + id, lugar: 'box',
  fuerza: [{ ejercicio: 'back-squat', reps: 5, series: [90], tempo }, { ejercicio: 'press-banca', reps: 5, series: [60] }],
});

test('conTempo: sin tempo o vacío cuenta como sin tempo', () => {
  expect(conTempo(undefined)).toBe(false);
  expect(conTempo('sin tempo')).toBe(false);
  expect(conTempo('4s+pausa')).toBe(true);
  expect(conTempo('3s')).toBe(true);
});
test('filtrarPorTempo deja solo las fuerzas del ejercicio que cumplen el filtro', () => {
  const ses = [s('1', '4s+pausa'), s('2', 'sin tempo'), s('3')];
  expect(filtrarPorTempo(ses, 'back-squat', 'todas')).toBe(ses);
  expect(filtrarPorTempo(ses, 'back-squat', 'con').map((x) => x.id)).toEqual(['1']);
  expect(filtrarPorTempo(ses, 'back-squat', 'sin').map((x) => x.id)).toEqual(['2', '3']);
  expect(filtrarPorTempo(ses, 'back-squat', 'con')[0].fuerza.map((f) => f.ejercicio)).toEqual(['back-squat']);
});

test('filtro por tempo exacto y lista de tempos usados', async () => {
  const { temposUsados, textoTempo } = await import('../../src/domain/progreso');
  const ses = [s('1', '5s'), s('2', '3s'), s('3', '4s+pausa'), s('4', '4s'), s('5', 'sin tempo'), s('6', '5s')];
  expect(filtrarPorTempo(ses, 'back-squat', '5s').map((x) => x.id)).toEqual(['1', '6']);
  expect(temposUsados(ses, 'back-squat')).toEqual(['3s', '4s', '4s+pausa', '5s']);
  expect(temposUsados(ses, 'press-banca')).toEqual([]);
  expect(textoTempo('4s+pausa')).toBe('4 s + pausa');
});
