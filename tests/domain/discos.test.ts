import { cargaPosible, conBarra, discosPorLado, tablaPorcentajes } from '../../src/domain/discos';

test('discos por lado, de mayor a menor', () => {
  expect(discosPorLado(100, 20)).toEqual({ lado: [25, 15], total: 100 });
  expect(discosPorLado(87.5, 20)).toEqual({ lado: [25, 5, 2.5, 1.25], total: 87.5 });
  expect(discosPorLado(20, 20)).toEqual({ lado: [], total: 20 });
  expect(discosPorLado(52.5, 15)).toEqual({ lado: [15, 2.5, 1.25], total: 52.5 });
});
test('lo que no sale exacto se redondea a la carga montable más cercana', () => {
  expect(cargaPosible(61, 20)).toBe(60);
  expect(cargaPosible(61.5, 20)).toBe(62.5);
  expect(cargaPosible(10, 20)).toBe(20);
  expect(discosPorLado(83, 20).total).toBe(82.5);
});
test('tabla de porcentajes redondeada', () => {
  const t = tablaPorcentajes(100, 20, [70, 75, 100]);
  expect(t).toEqual([{ p: 70, kg: 70 }, { p: 75, kg: 75 }, { p: 100, kg: 100 }]);
  expect(tablaPorcentajes(93, 20, [80])[0].kg).toBe(75); // 74,4 → 75
});
test('solo los ejercicios con barra', () => {
  expect(conBarra('back-squat')).toBe(true);
  expect(conBarra('kb-swing')).toBe(false);
  expect(conBarra('dominadas')).toBe(false);
});
