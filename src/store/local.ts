import { get, set } from 'idb-keyval';
import type { Datos, Ejercicio, Sesion } from '../domain/types';

export interface Ajustes {
  token?: string; ultimoSha?: string; pendiente: boolean; ultimaSync?: string; minSesionesSemana: number;
}

export const EJERCICIOS_BASE: Ejercicio[] = [
  { id: 'back-squat', nombre: 'Back Squat', grupo: 'Dom. Rodilla' },
  { id: 'front-squat', nombre: 'Front Squat', grupo: 'Dom. Rodilla' },
  { id: 'press-banca', nombre: 'Press Banca', grupo: 'Empuje horizontal' },
  { id: 'shoulder-press', nombre: 'Shoulder Press', grupo: 'Empuje vertical' },
  { id: 'deadlift', nombre: 'Peso muerto', grupo: 'Dom. Cadera' },
  { id: 'push-press', nombre: 'Push Press', grupo: 'Empuje vertical' },
  { id: 'snatch', nombre: 'Snatch', grupo: 'Halterofilia' },
  { id: 'power-snatch', nombre: 'Power Snatch', grupo: 'Halterofilia' },
  { id: 'clean', nombre: 'Clean', grupo: 'Halterofilia' },
  { id: 'power-clean', nombre: 'Power Clean', grupo: 'Halterofilia' },
  { id: 'dips', nombre: 'Dips', grupo: 'Empuje vertical' },
  { id: 'push-ups', nombre: 'Push Ups', grupo: 'Empuje horizontal' },
];

const AJUSTES_DEF: Ajustes = { pendiente: false, minSesionesSemana: 3 };

export function datosVacios(): Datos {
  return { version: 1, ejercicios: EJERCICIOS_BASE, sesiones: [], carreras: [] };
}

export async function cargarLocal(): Promise<Datos> {
  return (await get<Datos>('datos')) ?? datosVacios();
}

export async function reemplazarDatos(d: Datos): Promise<void> {
  await set('datos', d);
}

export async function cargarAjustes(): Promise<Ajustes> {
  return { ...AJUSTES_DEF, ...((await get<Partial<Ajustes>>('ajustes')) ?? {}) };
}

export async function guardarAjustes(a: Partial<Ajustes>): Promise<void> {
  await set('ajustes', { ...(await cargarAjustes()), ...a });
}

let cola: Promise<unknown> = Promise.resolve();

/** Serializa las operaciones de lectura-modificación-escritura sobre los datos locales. */
export function conBloqueo<T>(fn: () => Promise<T>): Promise<T> {
  const r = cola.then(fn, fn);
  cola = r.catch(() => undefined);
  return r;
}

function ahora(): string {
  return new Date().toISOString();
}

export function guardarSesion(s: Sesion): Promise<void> {
  return conBloqueo(async () => {
  const d = await cargarLocal();
  const nueva = { ...s, actualizado: ahora() };
  const i = d.sesiones.findIndex((x) => x.id === s.id);
  const sesiones = i >= 0 ? d.sesiones.map((x, j) => (j === i ? nueva : x)) : [...d.sesiones, nueva];
  await reemplazarDatos({ ...d, sesiones });
  await guardarAjustes({ pendiente: true });
  });
}

export function borrarSesion(id: string): Promise<void> {
  return conBloqueo(async () => {
  const d = await cargarLocal();
  const sesiones = d.sesiones.map((x) => (x.id === id ? { ...x, borrado: true, actualizado: ahora() } : x));
  await reemplazarDatos({ ...d, sesiones });
  await guardarAjustes({ pendiente: true });
  });
}
