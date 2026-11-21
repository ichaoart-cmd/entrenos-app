import { clear } from 'idb-keyval';
import { sincronizar } from '../../src/store/sync';
import { cargarLocal, cargarAjustes, guardarAjustes, guardarSesion } from '../../src/store/local';
import { codificar } from '../../src/store/github';
import { sesion } from '../fixtures/sesiones';

const vacio = { version: 1 as const, ejercicios: [], sesiones: [], carreras: [] };
beforeEach(async () => { await clear(); });
afterEach(() => vi.unstubAllGlobals());

test('un guardado durante la sincronización no se pierde', async () => {
  await guardarAjustes({ token: 't' });
  await guardarSesion(sesion('a', '2026-11-20', 'back-squat', 5, [94]));
  let enCurso: Promise<void> | null = null;
  vi.stubGlobal('fetch', vi.fn(async (_u: string, init?: RequestInit) => {
    if (init?.method === 'PUT') {
      enCurso = guardarSesion(sesion('nueva', '2026-11-21', 'deadlift', 5, [130]));
      return new Response(JSON.stringify({ content: { sha: 's2' } }), { status: 200 });
    }
    return new Response(JSON.stringify({ sha: 's1', content: codificar(vacio) }), { status: 200 });
  }));
  await sincronizar();
  await enCurso;
  const d = await cargarLocal();
  expect(d.sesiones.map((s) => s.id).sort()).toEqual(['a', 'nueva']);
  expect((await cargarAjustes()).pendiente).toBe(true);
});

test('token sin acceso al repo (404 al escribir) se informa como problema de token', async () => {
  await guardarAjustes({ token: 't' });
  await guardarSesion(sesion('a', '2026-11-20', 'back-squat', 5, [94]));
  vi.stubGlobal('fetch', vi.fn(async () => new Response(null, { status: 404 })));
  expect(await sincronizar()).toEqual({ ok: false, motivo: 'token' });
});
