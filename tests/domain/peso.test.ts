import { pesoEn, fuerzaRelativa } from '../../src/domain/peso';
import { fusionar } from '../../src/domain/fusion';
import type { Datos, PesoCorporal } from '../../src/domain/types';

const p = (id: string, fecha: string, kg: number, extra: Partial<PesoCorporal> = {}): PesoCorporal => ({ id, actualizado: '2026-01-01T00:00:00Z', fecha, kg, ...extra });

test('peso en una fecha: el último apuntado hasta ese día; si no hay, el primero', () => {
  const ps = [p('a', '2026-01-01', 80), p('b', '2026-06-01', 78), p('c', '2026-07-01', 90, { borrado: true })];
  expect(pesoEn(ps, '2026-03-01')).toBe(80);
  expect(pesoEn(ps, '2026-08-01')).toBe(78);
  expect(pesoEn(ps, '2025-01-01')).toBe(80);
  expect(pesoEn([], '2026-01-01')).toBeNull();
});
test('fuerza relativa con dos decimales', () => {
  expect(fuerzaRelativa(110, 80)).toBe(1.38);
});
test('la fusión une los pesos y no añade la lista si nadie tiene pesos', () => {
  const base: Datos = { version: 1, ejercicios: [], sesiones: [], carreras: [] };
  expect(fusionar(base, base)).not.toHaveProperty('pesos');
  const r = fusionar({ ...base, pesos: [p('a', '2026-01-01', 80)] }, { ...base, pesos: [p('b', '2026-02-01', 79)] });
  expect(r.pesos?.map((x) => x.id)).toEqual(['a', 'b']);
});
