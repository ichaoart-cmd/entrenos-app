import { fusionar } from '../domain/fusion';
import { ErrorGitHub, escribirRemoto, leerRemoto } from './github';
import { cargarAjustes, cargarLocal, conBloqueo, guardarAjustes, reemplazarDatos } from './local';

export type ResultadoSync = { ok: true } | { ok: false; motivo: 'sin-token' | 'token' | 'limite' | 'red' | 'conflicto' };

const canon = (x: unknown) => JSON.stringify(x);

async function intento(token: string): Promise<void> {
  const remoto = await leerRemoto(token);
  const local = await cargarLocal();
  const fusion = remoto ? fusionar(local, remoto.datos) : fusionar(local, { ...local, sesiones: [], carreras: [], ejercicios: [] });
  let sha = remoto?.sha;
  // Se compara con el remoto normalizado (mismo orden) para no escribir por diferencias de orden.
  if (!remoto || canon(fusion) !== canon(fusionar(remoto.datos, remoto.datos))) {
    sha = await escribirRemoto(token, fusion, remoto?.sha, `Registro ${new Date().toISOString().slice(0, 16)}`);
  }
  // Bajo bloqueo: si el local cambió mientras tanto, se fusiona y queda pendiente para la próxima.
  await conBloqueo(async () => {
    const actual = await cargarLocal();
    if (canon(actual) === canon(local)) {
      await reemplazarDatos(fusion);
      await guardarAjustes({ pendiente: false, ultimoSha: sha, ultimaSync: new Date().toISOString() });
    } else {
      await reemplazarDatos(fusionar(actual, fusion));
      await guardarAjustes({ pendiente: true, ultimoSha: sha });
    }
  });
}

export async function sincronizar(): Promise<ResultadoSync> {
  const { token } = await cargarAjustes();
  if (!token) return { ok: false, motivo: 'sin-token' };
  for (let i = 0; i < 2; i++) {
    try {
      await intento(token);
      return { ok: true };
    } catch (e) {
      if (e instanceof ErrorGitHub) {
        if (e.limite) return { ok: false, motivo: 'limite' };
        // 404 aquí = el token no tiene acceso al repo de datos (el GET 404 ya se trata como "archivo nuevo").
        if (e.status === 401 || e.status === 403 || e.status === 404) return { ok: false, motivo: 'token' };
        if (e.status === 409 || e.status === 422) continue;
        return { ok: false, motivo: 'red' };
      }
      return { ok: false, motivo: 'red' };
    }
  }
  return { ok: false, motivo: 'conflicto' };
}
