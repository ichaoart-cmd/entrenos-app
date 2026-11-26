import { entrada } from './catalogo';

/** Discos habituales de un box (kg), de mayor a menor. */
export const DISCOS = [25, 20, 15, 10, 5, 2.5, 1.25];
export const BARRAS = [20, 15, 10];

const SIN_BARRA = new Set(['goblet-squat', 'db-press', 'dips', 'push-ups', 'dominadas', 'remo-mancuerna', 'walking-lunge', 'bulgarian-split-squat']);

/** ¿Se hace con barra y discos? (para ofrecer la calculadora solo donde tiene sentido) */
export function conBarra(id: string): boolean {
  return !SIN_BARRA.has(id) && entrada(id)?.grupo !== 'Kettlebell y mancuerna';
}

/** Carga montable más cercana: la barra más parejas del disco más pequeño (por defecto, saltos de 2,5 kg). */
export function cargaPosible(kg: number, barra: number, menor = DISCOS[DISCOS.length - 1]): number {
  if (!(kg > barra)) return barra;
  const salto = menor * 2;
  return barra + Math.round((kg - barra) / salto) * salto;
}

/** Discos de un lado para montar `kg` con esa barra (de mayor a menor) y el total que queda montado. */
export function discosPorLado(kg: number, barra: number, discos = DISCOS): { lado: number[]; total: number } {
  const total = cargaPosible(kg, barra, Math.min(...discos));
  let resto = Math.round(((total - barra) / 2) * 100) / 100;
  const lado: number[] = [];
  for (const d of discos) {
    while (resto >= d - 1e-9) { lado.push(d); resto = Math.round((resto - d) * 100) / 100; }
  }
  return { lado, total };
}

/** Tabla de porcentajes de un 1RM, redondeada a cargas montables. */
export function tablaPorcentajes(rm: number, barra: number, porcentajes = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100]) {
  return porcentajes.map((p) => ({ p, kg: cargaPosible((rm * p) / 100, barra) }));
}
