import { deStrava, incorporarStrava, type ActividadStrava } from '../../src/domain/strava';
import type { Datos } from '../../src/domain/types';

const act = (id: number, extra: Partial<ActividadStrava> = {}): ActividadStrava => ({
  id, sport_type: 'Run', start_date_local: '2026-11-20T08:15:00Z', distance: 8034.6, moving_time: 2530,
  total_elevation_gain: 41.2, average_heartrate: 151.4, ...extra,
});
const AHORA = '2026-11-22T10:00:00.000Z';

test('convierte una carrera de Strava', () => {
  expect(deStrava(act(99), AHORA)).toEqual({
    id: 'strava-99', actualizado: AHORA, fecha: '2026-11-20', distanciaKm: 8.03, tiempoSeg: 2530,
    stravaId: 99, desnivelM: 41, fcMedia: 151,
  });
});
test('ignora lo que no es correr', () => {
  expect(deStrava(act(1, { sport_type: 'Ride' }), AHORA)).toBeNull();
  expect(deStrava(act(2, { sport_type: 'TrailRun' }), AHORA)?.stravaId).toBe(2);
  expect(deStrava(act(3, { sport_type: 'Walk' }), AHORA)).toBeNull();
});
test('sin FC no pone fcMedia', () => {
  expect(deStrava(act(5, { average_heartrate: undefined }), AHORA)).not.toHaveProperty('fcMedia');
});
test('incorpora solo las nuevas y no toca las ya importadas (aunque se editaran o borraran)', () => {
  const d: Datos = { version: 1, ejercicios: [], sesiones: [], carreras: [
    { id: 'strava-1', actualizado: '2026-11-21T00:00:00Z', fecha: '2026-11-18', distanciaKm: 5, tiempoSeg: 1500, stravaId: 1, tipo: 'series' },
    { id: 'strava-2', actualizado: '2026-11-21T00:00:00Z', fecha: '2026-11-19', distanciaKm: 5, tiempoSeg: 1500, stravaId: 2, borrado: true },
  ] };
  const r = incorporarStrava(d, [act(1), act(2), act(3), act(4, { sport_type: 'Ride' })], AHORA);
  expect(r.nuevas).toBe(1);
  expect(r.datos.carreras.map((x) => x.id)).toEqual(['strava-1', 'strava-2', 'strava-3']);
  expect(r.datos.carreras[0].tipo).toBe('series');
});
