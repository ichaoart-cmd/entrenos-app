import type { Carrera, Datos } from './types';

/** Lo que usamos de una actividad de la API de Strava (GET /athlete/activities). */
export interface ActividadStrava {
  id: number; sport_type: string; start_date_local: string; distance: number; moving_time: number;
  total_elevation_gain?: number; average_heartrate?: number;
}

const CORRER = new Set(['Run', 'TrailRun', 'VirtualRun']);

export function deStrava(a: ActividadStrava, ahora: string): Carrera | null {
  if (!CORRER.has(a.sport_type) || !(a.distance > 0) || !(a.moving_time > 0)) return null;
  const c: Carrera = {
    id: `strava-${a.id}`, actualizado: ahora, fecha: a.start_date_local.slice(0, 10),
    distanciaKm: Math.round(a.distance / 10) / 100, tiempoSeg: a.moving_time, stravaId: a.id,
  };
  if (a.total_elevation_gain != null) c.desnivelM = Math.round(a.total_elevation_gain);
  if (a.average_heartrate != null) c.fcMedia = Math.round(a.average_heartrate);
  return c;
}

/** Añade las carreras de Strava que aún no estén (por stravaId). Las ya importadas no se tocan: el usuario puede haberlas editado o borrado. */
export function incorporarStrava(d: Datos, actividades: ActividadStrava[], ahora: string) {
  const ya = new Set(d.carreras.map((c) => c.stravaId).filter((x) => x != null));
  const nuevas = actividades.filter((a) => !ya.has(a.id)).map((a) => deStrava(a, ahora)).filter((c): c is Carrera => !!c);
  const carreras = [...d.carreras, ...nuevas].sort((a, b) => a.fecha.localeCompare(b.fecha));
  return { datos: { ...d, carreras }, nuevas: nuevas.length };
}
