import { desdeCuando, obtenerAcceso, descargarActividades } from '../../scripts/strava/cliente';
import type { Datos } from '../../src/domain/types';

const datos = (carreras: Datos['carreras']): Datos => ({ version: 1, ejercicios: [], sesiones: [], carreras });
const resp = (body: unknown, ok = true, status = 200) => ({ ok, status, json: async () => body }) as Response;

test('desdeCuando: 3 días antes de la última de Strava, o desde 2024 si no hay', () => {
  expect(desdeCuando(datos([]))).toBe(Date.UTC(2024, 0, 1) / 1000);
  const d = datos([
    { id: 'm', actualizado: '', fecha: '2026-11-21', distanciaKm: 5, tiempoSeg: 1500 },
    { id: 'strava-1', actualizado: '', fecha: '2026-11-10', distanciaKm: 5, tiempoSeg: 1500, stravaId: 1 },
  ]);
  expect(desdeCuando(d)).toBe(Date.UTC(2026, 10, 7) / 1000);
});

test('obtenerAcceso: con código lo canjea; si no, usa el refresh token guardado; devuelve el refresh nuevo', async () => {
  const f = vi.fn(async (_u: string, init?: RequestInit) => resp({ access_token: 'A', refresh_token: 'R2', body: String(init?.body) }));
  const r1 = await obtenerAcceso(f, { clientId: '1', secreto: 's', codigo: 'C' });
  expect(String(f.mock.calls[0][1]?.body)).toContain('grant_type=authorization_code');
  expect(String(f.mock.calls[0][1]?.body)).toContain('code=C');
  expect(r1).toEqual({ acceso: 'A', refresco: 'R2' });
  await obtenerAcceso(f, { clientId: '1', secreto: 's', refresco: 'R1' });
  expect(String(f.mock.calls[1][1]?.body)).toContain('grant_type=refresh_token');
  expect(String(f.mock.calls[1][1]?.body)).toContain('refresh_token=R1');
});

test('obtenerAcceso sin código ni token explica qué falta', async () => {
  await expect(obtenerAcceso(vi.fn(), { clientId: '1', secreto: 's' })).rejects.toThrow(/Conectar|código/);
});

test('obtenerAcceso con error de Strava no deja ver el secreto', async () => {
  const f = vi.fn(async () => resp({ message: 'Bad Request' }, false, 400));
  await expect(obtenerAcceso(f, { clientId: '1', secreto: 'supersecreto', codigo: 'X' })).rejects.toThrow(/400/);
  await expect(obtenerAcceso(f, { clientId: '1', secreto: 'supersecreto', codigo: 'X' })).rejects.not.toThrow(/supersecreto/);
});

test('descargarActividades pagina hasta una página vacía', async () => {
  const paginas = [[{ id: 1 }, { id: 2 }], [{ id: 3 }], []];
  const f = vi.fn(async (u: string, _i?: RequestInit) => resp(paginas[Number(new URL(u).searchParams.get('page')) - 1]));
  const r = await descargarActividades(f, 'A', 1000);
  expect(r.map((a) => a.id)).toEqual([1, 2, 3]);
  expect(f.mock.calls[0][0]).toContain('after=1000');
  expect((f.mock.calls[0][1] as RequestInit).headers).toEqual({ Authorization: 'Bearer A' });
});
