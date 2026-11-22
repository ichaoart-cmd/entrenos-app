import { ejerciciosHabituales, retoSemanal, entrenoDeHoy } from '../../src/domain/inicio';
import type { Carrera, Sesion } from '../../src/domain/types';

const ses = (id: string, fecha: string, ej: string, kg = 50, extra: Partial<Sesion> = {}): Sesion =>
  ({ id, actualizado: '', fecha, lugar: 'box', fuerza: ej ? [{ ejercicio: ej, reps: 5, series: [kg] }] : [], ...extra });

test('ejercicios habituales: los más hechos en los últimos 4 meses, con días desde la última vez', () => {
  const s = [ses('1', '2026-11-01', 'snatch'), ses('2', '2026-11-10', 'snatch', 60), ses('3', '2026-11-12', 'back-squat', 100),
    ses('4', '2026-10-01', 'press-banca'), ses('5', '2026-01-01', 'deadlift'), ses('6', '2026-01-02', 'deadlift'), ses('7', '2026-01-03', 'deadlift')];
  const r = ejerciciosHabituales(s, '2026-11-22', 4);
  expect(r.map((x) => x.id)).toEqual(['snatch', 'back-squat', 'press-banca', 'deadlift']);
  expect(r[0]).toEqual({ id: 'snatch', dias: 12, top: 60 });
});
test('sin historial, propone los básicos', () => {
  expect(ejerciciosHabituales([], '2026-11-22', 4).map((x) => x.id)).toEqual(['back-squat', 'press-banca', 'shoulder-press', 'deadlift']);
});
test('reto semanal: cambia cada semana y trae tu marca si ya lo hiciste', () => {
  const a = retoSemanal([], '2026-11-16'), b = retoSemanal([], '2026-11-22'), c = retoSemanal([], '2026-11-23');
  expect(a.benchmark.id).toBe(b.benchmark.id);
  expect(c.benchmark.id).not.toBe(b.benchmark.id);
  const hecho = ses('x', '2026-07-01', '', 0, { metcon: { formato: 'ForTime', benchmark: b.benchmark.id, rx: true, resultado: { tipo: 'tiempo', valor: '5:40' } } });
  expect(retoSemanal([hecho], '2026-11-22')).toMatchObject({ mejor: { valor: '5:40' }, diasDesde: 144 });
});
test('entreno de hoy: sesiones y carreras de hoy, y si hubo récord', () => {
  const s = [ses('a', '2026-11-01', 'back-squat', 90), ses('b', '2026-11-22', 'back-squat', 95)];
  const c: Carrera[] = [{ id: 'c', actualizado: '', fecha: '2026-11-22', distanciaKm: 5, tiempoSeg: 1500 }];
  const h = entrenoDeHoy(s, c, '2026-11-22');
  expect(h.sesiones.map((x) => x.id)).toEqual(['b']);
  expect(h.carreras).toHaveLength(1);
  expect(h.record).toBe(true);
  expect(entrenoDeHoy(s, c, '2026-11-23').vacio).toBe(true);
});
