import type { Datos } from '../../src/domain/types';
import type { ActividadStrava } from '../../src/domain/strava';

type Fetch = (url: string, init?: RequestInit) => Promise<Response>;

/** Segundos epoch desde los que pedir actividades: 3 días antes de la última importada (por si Mi Fitness tarda), o desde 2024. */
export function desdeCuando(d: Datos): number {
  const ult = d.carreras.filter((c) => c.stravaId != null).reduce((a, c) => (c.fecha > a ? c.fecha : a), '');
  if (!ult) return Date.UTC(2024, 0, 1) / 1000;
  return Date.parse(`${ult}T00:00:00Z`) / 1000 - 3 * 86400;
}

export async function obtenerAcceso(f: Fetch, o: { clientId: string; secreto: string; codigo?: string; refresco?: string }) {
  const p = new URLSearchParams({ client_id: o.clientId, client_secret: o.secreto });
  if (o.codigo) { p.set('grant_type', 'authorization_code'); p.set('code', o.codigo); }
  else if (o.refresco) { p.set('grant_type', 'refresh_token'); p.set('refresh_token', o.refresco); }
  else throw new Error('Strava aún no está conectado: ejecuta la acción «Carreras de Strava» con el código de autorización.');
  const r = await f('https://www.strava.com/oauth/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString(),
  });
  if (!r.ok) throw new Error(`Strava rechazó la autorización (${r.status}). Si el código ya se usó o caducó, pide uno nuevo.`);
  const j = (await r.json()) as { access_token: string; refresh_token: string };
  return { acceso: j.access_token, refresco: j.refresh_token };
}

export async function descargarActividades(f: Fetch, acceso: string, after: number): Promise<ActividadStrava[]> {
  const todas: ActividadStrava[] = [];
  for (let page = 1; page < 50; page++) {
    const r = await f(`https://www.strava.com/api/v3/athlete/activities?after=${after}&per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${acceso}` } });
    if (!r.ok) throw new Error(`Strava devolvió ${r.status} al leer actividades.`);
    const lote = (await r.json()) as ActividadStrava[];
    if (!lote.length) break;
    todas.push(...lote);
  }
  return todas;
}
