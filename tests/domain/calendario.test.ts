import { semanasDelMes, rachaSemanas, sesionesPorDia } from '../../src/domain/calendario';
import { sesion } from '../fixtures/sesiones';

test('semanasDelMes empieza en lunes y rellena con null', () => {
  const s = semanasDelMes(2026, 11); // noviembre 2026: el 1 es domingo
  expect(s[0]).toEqual([null, null, null, null, null, null, '2026-11-01']);
  expect(s.at(-1)!.filter(Boolean).at(-1)).toBe('2026-11-30');
  expect(s.every((w) => w.length === 7)).toBe(true);
});
test('sesionesPorDia agrupa y omite borradas', () => {
  const m = sesionesPorDia([sesion('a', '2026-11-02', 'back-squat', 5, [90]), sesion('b', '2026-11-02', 'deadlift', 5, [120]), sesion('z', '2026-11-03', 'deadlift', 5, [1], { borrado: true })]);
  expect(m.get('2026-11-02')).toHaveLength(2);
  expect(m.has('2026-11-03')).toBe(false);
});
test('racha de semanas con mínimo de sesiones', () => {
  const f = ['2026-11-16', '2026-11-18', '2026-11-20', '2026-11-09', '2026-11-11', '2026-11-12', '2026-11-03'];
  // semana del 16: 3 ✓ · semana del 9: 3 ✓ · semana del 2: 1 ✗
  expect(rachaSemanas(f, 3, '2026-11-22')).toBe(2);
});
test('la semana en curso no rompe la racha si aún no llega al mínimo', () => {
  const f = ['2026-11-23', '2026-11-16', '2026-11-18', '2026-11-20'];
  expect(rachaSemanas(f, 3, '2026-11-24')).toBe(1);
  expect(rachaSemanas([...f, '2026-11-24', '2026-11-25'], 3, '2026-11-25')).toBe(2);
});
