import { signal } from '@preact/signals';
import type { Carrera, Datos, Sesion } from '../domain/types';
import { DISTANCIAS, mejoresTiempos } from '../domain/carrera';
import { detectarPR, recordsPorReps, type PR } from '../domain/records';
import { borrarCarrera, guardarCarrera, borrarSesion, cargarAjustes, cargarLocal, datosVacios, guardarSesion, type Ajustes } from './local';
import { sincronizar, type ResultadoSync } from './sync';

export type EstadoSync = 'ok' | 'pendiente' | 'error';

export const estado = {
  datos: signal<Datos>(datosVacios()),
  ajustes: signal<Ajustes>({ pendiente: false, minSesionesSemana: 3 }),
  estadoSync: signal<EstadoSync>('ok'),
  ultimoResultado: signal<ResultadoSync | null>(null),
};

async function recargar(): Promise<void> {
  estado.datos.value = await cargarLocal();
  estado.ajustes.value = await cargarAjustes();
}

export async function sincronizarAhora(): Promise<ResultadoSync> {
  const r = await sincronizar();
  estado.ultimoResultado.value = r;
  await recargar();
  const pendiente = estado.ajustes.value.pendiente;
  estado.estadoSync.value =
    !r.ok && (r.motivo === 'token' || r.motivo === 'sin-token') ? 'error' : pendiente ? 'pendiente' : 'ok';
  return r;
}

export async function iniciar(): Promise<void> {
  await recargar();
  estado.estadoSync.value = estado.ajustes.value.pendiente ? 'pendiente' : 'ok';
  void sincronizarAhora();
  addEventListener('online', () => void sincronizarAhora());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') void sincronizarAhora();
  });
}

/** Guarda la sesión, lanza la sincronización sin esperarla y devuelve el PR de la primera fuerza, si lo hay. */
export async function registrar(s: Sesion): Promise<PR | null> {
  const historial = estado.datos.value.sesiones.filter((x) => x.id !== s.id);
  const f = s.fuerza[0];
  // El primer registro de un ejercicio no se anuncia como récord.
  const pr = f && recordsPorReps(historial, f.ejercicio).size > 0 ? detectarPR(f, s.fecha, historial) : null;
  await guardarSesion(s);
  await recargar();
  estado.estadoSync.value = 'pendiente';
  void sincronizarAhora();
  return pr;
}

export async function borrar(id: string): Promise<void> {
  await borrarSesion(id);
  await recargar();
  estado.estadoSync.value = 'pendiente';
  void sincronizarAhora();
}

export interface MarcaCarrera { nombre: string; seg: number }

/** Guarda la carrera y devuelve la distancia en la que mejora la marca (la más larga), si mejora alguna que ya existía. */
export async function registrarCarrera(c: Carrera): Promise<MarcaCarrera | null> {
  const antes = mejoresTiempos(estado.datos.value.carreras.filter((x) => x.id !== c.id));
  const despues = mejoresTiempos([...estado.datos.value.carreras.filter((x) => x.id !== c.id), c]);
  const mejora = despues.filter((m) => { const a = antes.find((x) => x.km === m.km); return a && m.seg < a.seg; }).pop();
  await guardarCarrera(c);
  await recargar();
  estado.estadoSync.value = 'pendiente';
  void sincronizarAhora();
  return mejora ? { nombre: DISTANCIAS.find((d) => d.km === mejora.km)!.nombre, seg: mejora.seg } : null;
}

export async function quitarCarrera(id: string): Promise<void> {
  await borrarCarrera(id);
  await recargar();
  estado.estadoSync.value = 'pendiente';
  void sincronizarAhora();
}
