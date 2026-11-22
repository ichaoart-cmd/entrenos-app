import { formatearRitmo, formatearTiempo, kmPorSemana, mejoresTiempos, prediccion, riegel, ritmoSegKm, partirTiempo } from '../../src/domain/carrera';
import type { Carrera } from '../../src/domain/types';

const c = (fecha: string, km: number, seg: number, extra: Partial<Carrera> = {}): Carrera =>
  ({ id: fecha + km, actualizado: '2024-01-01T00:00:00Z', fecha, distanciaKm: km, tiempoSeg: seg, ...extra });

test('ritmo en s/km y formatos', () => {
  expect(ritmoSegKm(c('2026-11-01', 8, 2530))).toBeCloseTo(316.25);
  expect(formatearRitmo(316.25)).toBe('5:16');
  expect(formatearTiempo(2530)).toBe('42:10');
  expect(formatearTiempo(3725)).toBe('1:02:05');
  expect(partirTiempo(3725)).toEqual({ h: 1, m: 2, s: 5 });
});
test('Riegel: el doble de distancia tarda 2^1,06 veces', () => {
  expect(riegel(1500, 5, 10)).toBeCloseTo(1500 * 2 ** 1.06);
});
test('km por semana: últimas n semanas (lunes) incluida la actual, con ceros', () => {
  const r = kmPorSemana([c('2026-11-16', 5, 1500), c('2026-11-20', 8, 2600), c('2026-11-03', 10, 3300), c('2026-11-17', 3, 900, { borrado: true })], 3, '2026-11-22');
  expect(r).toEqual([{ lunes: '2026-11-02', km: 10 }, { lunes: '2026-11-09', km: 0 }, { lunes: '2026-11-16', km: 13 }]);
});
test('mejores tiempos: escala al punto exacto carreras de esa distancia o algo más', () => {
  const r = mejoresTiempos([c('2026-10-01', 5.05, 1515), c('2026-10-08', 5, 1560), c('2026-10-09', 6, 1700), c('2026-10-10', 10.1, 3030)]);
  expect(r.find((m) => m.km === 5)).toEqual({ km: 5, seg: 1500, fecha: '2026-10-01' });
  expect(r.find((m) => m.km === 10)?.seg).toBe(3000);
  expect(r.find((m) => m.km === 21.0975)).toBeUndefined();
});
test('predicción: desde la carrera reciente (≥3 km) que da mejor 10 km', () => {
  const p = prediccion([c('2026-11-01', 5, 1500), c('2026-11-10', 10, 3300), c('2026-01-01', 5, 1200), c('2026-11-12', 2, 500)], '2026-11-22');
  expect(p?.base.fecha).toBe('2026-11-01');
  expect(p?.tiempos.find((t) => t.km === 10)?.seg).toBeCloseTo(riegel(1500, 5, 10));
  expect(prediccion([], '2026-11-22')).toBeNull();
});
