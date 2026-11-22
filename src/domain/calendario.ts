import type { Sesion } from './types';

const iso = (d: Date) => d.toISOString().slice(0, 10);
const utc = (s: string) => new Date(`${s}T00:00:00Z`);

/** Semanas (lunes a domingo) del mes `mes` (1-12); los huecos fuera del mes son null. */
export function semanasDelMes(año: number, mes: number): (string | null)[][] {
  const primero = new Date(Date.UTC(año, mes - 1, 1));
  const dias = new Date(Date.UTC(año, mes, 0)).getUTCDate();
  const desplaz = (primero.getUTCDay() + 6) % 7; // lunes = 0
  const celdas: (string | null)[] = Array(desplaz).fill(null);
  for (let d = 1; d <= dias; d++) celdas.push(iso(new Date(Date.UTC(año, mes - 1, d))));
  while (celdas.length % 7) celdas.push(null);
  return Array.from({ length: celdas.length / 7 }, (_, i) => celdas.slice(i * 7, i * 7 + 7));
}

export function sesionesPorDia(sesiones: Sesion[]): Map<string, Sesion[]> {
  const m = new Map<string, Sesion[]>();
  for (const s of sesiones) {
    if (s.borrado) continue;
    m.set(s.fecha, [...(m.get(s.fecha) ?? []), s]);
  }
  return m;
}

function lunes(fecha: string): string {
  const d = utc(fecha);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return iso(d);
}

/** Semanas seguidas (hasta hoy) con al menos `min` sesiones. La semana en curso solo suma si ya llega al mínimo. */
export function rachaSemanas(fechas: string[], min: number, hoy: string): number {
  const porSemana = new Map<string, number>();
  for (const f of fechas) porSemana.set(lunes(f), (porSemana.get(lunes(f)) ?? 0) + 1);
  const semana = utc(lunes(hoy));
  let racha = 0;
  if ((porSemana.get(iso(semana)) ?? 0) >= min) racha++;
  for (;;) {
    semana.setUTCDate(semana.getUTCDate() - 7);
    if ((porSemana.get(iso(semana)) ?? 0) < min) return racha;
    racha++;
  }
}
