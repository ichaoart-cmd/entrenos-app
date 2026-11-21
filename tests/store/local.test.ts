import { clear } from 'idb-keyval';
import { cargarLocal, guardarSesion, borrarSesion, cargarAjustes, guardarAjustes, reemplazarDatos, EJERCICIOS_BASE } from '../../src/store/local';
import { sesion } from '../fixtures/sesiones';

beforeEach(async () => { await clear(); });

test('vacío por defecto con ejercicios base', async () => {
  const d = await cargarLocal();
  expect(d.sesiones).toEqual([]);
  expect(d.ejercicios.map((e) => e.id)).toContain('back-squat');
  expect(EJERCICIOS_BASE).toHaveLength(12);
  expect((await cargarAjustes()).pendiente).toBe(false);
  expect((await cargarAjustes()).minSesionesSemana).toBe(3);
});

test('persiste-y-marca-pendiente', async () => {
  await guardarSesion(sesion('a', '2026-11-21', 'back-squat', 5, [94]));
  const d = await cargarLocal();
  expect(d.sesiones.map((s) => s.id)).toEqual(['a']);
  expect((await cargarAjustes()).pendiente).toBe(true);
});

test('guardar actualiza la marca de tiempo', async () => {
  await guardarSesion(sesion('a', '2024-01-08', 'back-squat', 5, [94]));
  const s = (await cargarLocal()).sesiones[0];
  expect(s.actualizado > '2024-01-08T20:00:00.000Z').toBe(true);
});

test('upsert-no-duplica', async () => {
  await guardarSesion(sesion('a', '2026-11-21', 'back-squat', 5, [94]));
  await guardarSesion(sesion('a', '2026-11-21', 'back-squat', 5, [96]));
  const d = await cargarLocal();
  expect(d.sesiones).toHaveLength(1);
  expect(d.sesiones[0].fuerza[0].series).toEqual([96]);
});

test('borrar-es-tombstone', async () => {
  await guardarSesion(sesion('a', '2026-11-21', 'back-squat', 5, [94]));
  await guardarAjustes({ pendiente: false });
  await borrarSesion('a');
  const d = await cargarLocal();
  expect(d.sesiones[0].borrado).toBe(true);
  expect((await cargarAjustes()).pendiente).toBe(true);
});

test('reemplazarDatos y ajustes parciales', async () => {
  await reemplazarDatos({ version: 1, ejercicios: [], sesiones: [sesion('x', '2024-01-08', 'deadlift', 5, [100])], carreras: [] });
  expect((await cargarLocal()).sesiones[0].id).toBe('x');
  await guardarAjustes({ token: 't' });
  await guardarAjustes({ ultimoSha: 's' });
  const a = await cargarAjustes();
  expect([a.token, a.ultimoSha]).toEqual(['t', 's']);
});
