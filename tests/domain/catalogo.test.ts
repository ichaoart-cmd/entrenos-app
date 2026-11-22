import { CATALOGO, buscarEjercicios, variantesDe, iconoDe } from '../../src/domain/catalogo';

test('el catálogo cubre los ejercicios comunes de CrossFit', () => {
  expect(CATALOGO.length).toBeGreaterThanOrEqual(35);
  const ids = CATALOGO.map((e) => e.id);
  for (const id of ['back-squat', 'overhead-squat', 'thruster', 'split-jerk', 'dominadas', 'kb-swing', 'sumo-deadlift', 'hang-power-clean'])
    expect(ids).toContain(id);
  expect(new Set(ids).size).toBe(ids.length);
});
test('buscar por nombre, alias y sin tildes ni mayúsculas', () => {
  expect(buscarEjercicios('militar').map((e) => e.id)).toContain('shoulder-press');
  expect(buscarEjercicios('ARRANCADA').map((e) => e.id)).toContain('snatch');
  expect(buscarEjercicios('dominada').map((e) => e.id)).toContain('dominadas');
  expect(buscarEjercicios('').length).toBe(CATALOGO.length);
});
test('las variantes dependen del ejercicio', () => {
  expect(variantesDe('press-banca').map((v) => v.valor)).not.toContain('btn');
  expect(variantesDe('shoulder-press').map((v) => v.valor)).toContain('btn');
  expect(variantesDe('thruster')).toEqual([{ valor: 'normal', texto: 'Normal' }]);
});
test('una variante guardada que ya no está en la lista se sigue mostrando', () => {
  expect(variantesDe('back-squat', 'close grip').map((v) => v.valor)).toContain('close grip');
});
test('todo ejercicio tiene icono', () => {
  for (const e of CATALOGO) expect(iconoDe(e.id)).toBeTruthy();
});
