import { clear } from 'idb-keyval';
import { sincronizar } from '../../src/store/sync';
import { cargarLocal, cargarAjustes, guardarAjustes, guardarSesion, reemplazarDatos, EJERCICIOS_BASE } from '../../src/store/local';
import type { Datos } from '../../src/domain/types';
import { sesion } from '../fixtures/sesiones';
import { codificar } from '../../src/store/github';

type Resp = { status: number; body?: unknown; headers?: Record<string, string> };
let respuestas: Resp[] = [];
let llamadas: { method: string; body?: any }[] = [];

function remoto(datos: Datos, sha = 'sha1'): Resp {
  return { status: 200, body: { sha, content: codificar(datos), encoding: 'base64' } };
}

beforeEach(async () => {
  await clear();
  respuestas = []; llamadas = [];
  vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
    llamadas.push({ method: init?.method ?? 'GET', body: init?.body ? JSON.parse(init.body as string) : undefined });
    const r = respuestas.shift();
    if (!r) throw new Error('sin respuesta preparada');
    if (r.status === -1) throw new TypeError('Failed to fetch');
    return new Response(r.body === undefined ? null : JSON.stringify(r.body), { status: r.status, headers: r.headers });
  }));
});
afterEach(() => vi.unstubAllGlobals());

const vacio: Datos = { version: 1, ejercicios: [], sesiones: [], carreras: [] };
const decodificarPut = (i: number): Datos => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(llamadas[i].body.content), (c) => c.charCodeAt(0))));

test('sin-token', async () => {
  expect(await sincronizar()).toEqual({ ok: false, motivo: 'sin-token' });
});

test('sincroniza-pendientes', async () => {
  await guardarAjustes({ token: 't' });
  await guardarSesion(sesion('a', '2026-11-21', 'back-squat', 5, [94]));
  respuestas = [remoto(vacio), { status: 200, body: { content: { sha: 'sha2' } } }];
  expect(await sincronizar()).toEqual({ ok: true });
  expect(llamadas.map((l) => l.method)).toEqual(['GET', 'PUT']);
  expect(llamadas[1].body.sha).toBe('sha1');
  expect(decodificarPut(1).sesiones.map((s) => s.id)).toEqual(['a']);
  const a = await cargarAjustes();
  expect([a.pendiente, a.ultimoSha]).toEqual([false, 'sha2']);
});

test('local-vacio-restaura-remoto', async () => {
  await guardarAjustes({ token: 't' });
  const muchas = Array.from({ length: 165 }, (_, i) => sesion(`s${i}`, '2025-01-01', 'deadlift', 5, [100]));
  respuestas = [remoto({ ...vacio, ejercicios: EJERCICIOS_BASE, sesiones: muchas })];
  expect(await sincronizar()).toEqual({ ok: true });
  expect((await cargarLocal()).sesiones).toHaveLength(165);
  expect(llamadas.map((l) => l.method)).toEqual(['GET']);
});

test('conflicto-sha-fusiona-y-reintenta', async () => {
  await guardarAjustes({ token: 't' });
  await guardarSesion(sesion('local', '2026-11-21', 'back-squat', 5, [94]));
  const otra = sesion('otra', '2026-11-20', 'deadlift', 5, [130]);
  respuestas = [remoto(vacio), { status: 409 }, remoto({ ...vacio, sesiones: [otra] }, 'sha3'), { status: 200, body: { content: { sha: 'sha4' } } }];
  expect(await sincronizar()).toEqual({ ok: true });
  expect(llamadas.map((l) => l.method)).toEqual(['GET', 'PUT', 'GET', 'PUT']);
  expect(decodificarPut(3).sesiones.map((s) => s.id).sort()).toEqual(['local', 'otra']);
  expect((await cargarLocal()).sesiones).toHaveLength(2);
});

test('token-invalido-no-pierde-datos', async () => {
  await guardarAjustes({ token: 'malo' });
  await guardarSesion(sesion('a', '2026-11-21', 'back-squat', 5, [94]));
  respuestas = [{ status: 401 }];
  expect(await sincronizar()).toEqual({ ok: false, motivo: 'token' });
  expect((await cargarLocal()).sesiones).toHaveLength(1);
  expect((await cargarAjustes()).pendiente).toBe(true);
});

test('sin-red', async () => {
  await guardarAjustes({ token: 't' });
  respuestas = [{ status: -1 }];
  expect(await sincronizar()).toEqual({ ok: false, motivo: 'red' });
});

test('primer-uso-crea-archivo', async () => {
  await guardarAjustes({ token: 't' });
  await guardarSesion(sesion('a', '2026-11-21', 'back-squat', 5, [94]));
  respuestas = [{ status: 404 }, { status: 201, body: { content: { sha: 'nuevo' } } }];
  expect(await sincronizar()).toEqual({ ok: true });
  expect(llamadas[1].body.sha).toBeUndefined();
});

test('tildes sobreviven la codificación', async () => {
  await guardarAjustes({ token: 't' });
  await guardarSesion({ ...sesion('a', '2026-11-21', 'back-squat', 5, [94]), nota: 'Pausa más larga ñ' });
  respuestas = [{ status: 404 }, { status: 201, body: { content: { sha: 'nuevo' } } }];
  await sincronizar();
  expect(decodificarPut(1).sesiones[0].nota).toBe('Pausa más larga ñ');
});

test('sin cambios no escribe', async () => {
  await guardarAjustes({ token: 't' });
  const s = sesion('a', '2026-01-01', 'deadlift', 5, [100]);
  await reemplazarDatos({ ...vacio, sesiones: [s] });
  respuestas = [remoto({ ...vacio, sesiones: [s] })];
  expect(await sincronizar()).toEqual({ ok: true });
  expect(llamadas.map((l) => l.method)).toEqual(['GET']);
});

test('limite-de-github-no-es-problema-de-token', async () => {
  await guardarAjustes({ token: 't' });
  respuestas = [{ status: 403, headers: { 'x-ratelimit-remaining': '0' } }];
  expect(await sincronizar()).toEqual({ ok: false, motivo: 'limite' });
  respuestas = [{ status: 429 }];
  expect(await sincronizar()).toEqual({ ok: false, motivo: 'limite' });
});
