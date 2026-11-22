import type { Carrera } from './types';

export const DISTANCIAS = [
  { km: 1, nombre: '1 km' }, { km: 5, nombre: '5 km' }, { km: 10, nombre: '10 km' },
  { km: 21.0975, nombre: 'Media maratón' }, { km: 42.195, nombre: 'Maratón' },
];

export const ritmoSegKm = (c: Pick<Carrera, 'distanciaKm' | 'tiempoSeg'>) => c.tiempoSeg / c.distanciaKm;

export function partirTiempo(seg: number) {
  const t = Math.round(seg);
  return { h: Math.floor(t / 3600), m: Math.floor((t % 3600) / 60), s: t % 60 };
}

const dos = (n: number) => String(n).padStart(2, '0');

/** 42:10 o 1:02:05 */
export function formatearTiempo(seg: number): string {
  const { h, m, s } = partirTiempo(seg);
  return h ? `${h}:${dos(m)}:${dos(s)}` : `${m}:${dos(s)}`;
}

/** Ritmo en min:seg por km (sin la unidad). */
export function formatearRitmo(segKm: number): string {
  const t = Math.round(segKm);
  return `${Math.floor(t / 60)}:${dos(t % 60)}`;
}

/** Fórmula de Riegel: tiempo esperado a d2 km habiendo hecho d1 km en t1 s. */
export const riegel = (t1: number, d1: number, d2: number) => t1 * (d2 / d1) ** 1.06;

const iso = (d: Date) => d.toISOString().slice(0, 10);
function lunes(fecha: string): string {
  const d = new Date(`${fecha}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
}

/** Km de cada una de las últimas `n` semanas (lunes a domingo), la última es la de `hoy`. */
export function kmPorSemana(carreras: Carrera[], n: number, hoy: string) {
  const fin = new Date(`${lunes(hoy)}T00:00:00Z`);
  const semanas = Array.from({ length: n }, (_, i) => {
    const d = new Date(fin); d.setUTCDate(d.getUTCDate() - 7 * (n - 1 - i));
    return { lunes: iso(d), km: 0 };
  });
  for (const c of carreras) {
    if (c.borrado) continue;
    const s = semanas.find((x) => x.lunes === lunes(c.fecha));
    if (s) s.km = Math.round((s.km + c.distanciaKm) * 100) / 100;
  }
  return semanas;
}

/** Mejor tiempo por distancia clásica, usando carreras de esa distancia o hasta un 10 % más (tiempo llevado a la distancia exacta). */
export function mejoresTiempos(carreras: Carrera[]) {
  const r: { km: number; seg: number; fecha: string }[] = [];
  for (const { km } of DISTANCIAS) {
    let mejor: { km: number; seg: number; fecha: string } | null = null;
    for (const c of carreras) {
      if (c.borrado || c.distanciaKm < km * 0.98 || c.distanciaKm > km * 1.1) continue;
      const seg = Math.round((c.tiempoSeg * km) / c.distanciaKm);
      if (!mejor || seg < mejor.seg) mejor = { km, seg, fecha: c.fecha };
    }
    if (mejor) r.push(mejor);
  }
  return r;
}

/** Predicción con Riegel desde la carrera de los últimos 90 días (≥ 3 km) que da el mejor 10 km. */
export function prediccion(carreras: Carrera[], hoy: string) {
  const desde = iso(new Date(Date.parse(`${hoy}T00:00:00Z`) - 90 * 864e5));
  const candidatas = carreras.filter((c) => !c.borrado && c.fecha >= desde && c.fecha <= hoy && c.distanciaKm >= 3);
  if (!candidatas.length) return null;
  const base = candidatas.reduce((a, c) => (riegel(c.tiempoSeg, c.distanciaKm, 10) < riegel(a.tiempoSeg, a.distanciaKm, 10) ? c : a));
  return {
    base,
    tiempos: DISTANCIAS.filter((d) => d.km >= 5).map((d) => ({ ...d, seg: riegel(base.tiempoSeg, base.distanciaKm, d.km) })),
  };
}
