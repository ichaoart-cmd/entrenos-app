import type { Carrera, Sesion } from './types';
import { tipoEjercicio, type TipoEntreno } from './tipos';

export const ZONAS = [
  { id: 'hombro', nombre: 'Hombro' }, { id: 'codo', nombre: 'Codo' }, { id: 'muneca', nombre: 'Muñeca' },
  { id: 'espalda', nombre: 'Espalda baja' }, { id: 'cadera', nombre: 'Cadera' }, { id: 'rodilla', nombre: 'Rodilla' },
  { id: 'tobillo', nombre: 'Tobillo' },
];
const ARTICULO: Record<string, string> = { hombro: 'el hombro', codo: 'el codo', muneca: 'la muñeca', espalda: 'la espalda baja', cadera: 'la cadera', rodilla: 'la rodilla', tobillo: 'el tobillo' };
/** «el hombro», «la rodilla»… */
export const conArticulo = (id: string) => ARTICULO[id] ?? id;
const ddmm = (f: string) => `${f.slice(8)}/${f.slice(5, 7)}`;
export const textoMolestia = (m: { zona: string; fecha: string }) => `${conArticulo(m.zona)} (${ddmm(m.fecha)})`;

/** Zonas que más carga cada tipo de entreno. */
const CARGA: Record<TipoEntreno, string[]> = {
  pierna: ['rodilla', 'cadera', 'espalda', 'tobillo'],
  torso: ['hombro', 'codo', 'muneca'],
  halterofilia: ['hombro', 'muneca', 'espalda', 'rodilla'],
  calistenia: ['hombro', 'codo', 'muneca'],
  metcon: [],
  carrera: ['rodilla', 'tobillo', 'cadera'],
};

export function zonasQueCarga(ejercicio: string): string[] {
  const t = ejercicio === 'correr' ? 'carrera' : tipoEjercicio(ejercicio);
  return t ? CARGA[t] : [];
}

/** Molestias apuntadas en los últimos `dias` días: la más reciente por zona, de más nueva a más antigua. */
export function molestiasRecientes(sesiones: Sesion[], carreras: Carrera[], hoy: string, excluir?: string, dias = 14) {
  const desde = new Date(Date.parse(`${hoy}T00:00:00Z`) - dias * 864e5).toISOString().slice(0, 10);
  const ult = new Map<string, string>();
  for (const x of [...sesiones, ...carreras]) {
    if (x.borrado || x.id === excluir || x.fecha < desde || x.fecha > hoy) continue;
    for (const z of x.molestias ?? []) if (x.fecha > (ult.get(z) ?? '')) ult.set(z, x.fecha);
  }
  return [...ult].map(([zona, fecha]) => ({ zona, fecha })).sort((a, b) => b.fecha.localeCompare(a.fecha));
}
