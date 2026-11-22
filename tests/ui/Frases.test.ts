import { delDia, sinRepetir, saludo, POOLS, conSorpresa } from '../../src/ui/frases';

beforeEach(() => localStorage.clear());

test('delDia: la misma frase todo el día y distinta al día siguiente', () => {
  const pool = ['a', 'b', 'c', 'd', 'e', 'f'];
  expect(delDia('x', pool, '2026-11-22')).toBe(delDia('x', pool, '2026-11-22'));
  for (const [d1, d2] of [['2026-11-22', '2026-11-23'], ['2026-12-31', '2027-01-01'], ['2026-03-01', '2026-03-02']])
    expect(delDia('x', pool, d1)).not.toBe(delDia('x', pool, d2));
});

test('sinRepetir: nunca sale la misma dos veces seguidas', () => {
  const pool = ['a', 'b', 'c'];
  let prev = '';
  for (let i = 0; i < 50; i++) { const f = sinRepetir('y', pool); expect(f).not.toBe(prev); prev = f; }
});

test('saludo según el momento: ausencia > racha > hora > día de la semana > general', () => {
  const base = { entrenadoHoy: false, diasSinEntrenar: 2, racha: 0 };
  const lunes10 = new Date('2026-11-23T10:00:00');
  expect(POOLS.ausencia.map((f) => f.replace('{n}', '12'))).toContain(saludo({ ...base, diasSinEntrenar: 12 }, lunes10, () => 0.5));
  expect(POOLS.racha.map((f) => f.replace('{n}', '6'))).toContain(saludo({ ...base, racha: 6 }, lunes10, () => 0.5));
  expect(POOLS.manana).toContain(saludo(base, new Date('2026-11-25T07:30:00'), () => 0.5));
  expect(POOLS.noche).toContain(saludo(base, new Date('2026-11-25T22:15:00'), () => 0.5));
  expect(POOLS.lunes).toContain(saludo(base, lunes10, () => 0.5));
  expect(POOLS.viernes).toContain(saludo(base, new Date('2026-11-27T12:00:00'), () => 0.5));
  expect(POOLS.saludo).toContain(saludo(base, new Date('2026-11-25T12:00:00'), () => 0.5));
});

test('días señalados mandan sobre todo lo demás', () => {
  expect(saludo({ entrenadoHoy: false, diasSinEntrenar: 30, racha: 0 }, new Date('2027-01-01T11:00:00'), () => 0.5)).toMatch(/año/i);
});

test('de vez en cuando (5 %) sale una rareza', () => {
  expect(POOLS.rarezas).toContain(conSorpresa(['normal'], () => 0.01));
  expect(conSorpresa(['normal'], () => 0.5)).toBe('normal');
});

test('hay bastantes frases en cada sitio', () => {
  for (const k of ['saludo', 'hero', 'hecho', 'guardado', 'finDescanso', 'respira', 'vacioHistorial', 'vacioCarrera', 'subHistorial', 'subProgreso', 'subAjustes', 'revancha', 'estreno'] as const)
    expect(POOLS[k].length).toBeGreaterThanOrEqual(5);
});
