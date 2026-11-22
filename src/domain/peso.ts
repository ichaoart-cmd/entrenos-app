import type { PesoCorporal } from './types';

/** Peso corporal en una fecha: el último apuntado hasta ese día; si no hay ninguno antes, el primero. */
export function pesoEn(pesos: PesoCorporal[], fecha: string): number | null {
  const vivos = pesos.filter((p) => !p.borrado).sort((a, b) => a.fecha.localeCompare(b.fecha));
  if (!vivos.length) return null;
  const antes = vivos.filter((p) => p.fecha <= fecha);
  return (antes.length ? antes[antes.length - 1] : vivos[0]).kg;
}

export const fuerzaRelativa = (kg: number, peso: number) => Math.round((kg / peso) * 100) / 100;
