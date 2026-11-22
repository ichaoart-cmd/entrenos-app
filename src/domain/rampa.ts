import { redondear05 } from './numeros';

/**
 * Series de aproximación hasta `top`.
 * Con historial (≥ 2 series) repite el salto medio entre series de la vez anterior; si no, sube desde el 80 %.
 * `n` = número de series elegido; por defecto, las de la vez anterior o 5.
 */
export function generarRampa(top: number, anterior?: number[], n?: number): number[] {
  let num = n ?? 5;
  let primera = top * 0.8;
  if (anterior && anterior.length >= 2) {
    num = n ?? anterior.length;
    const salto = (Math.max(...anterior) - anterior[0]) / (anterior.length - 1);
    primera = top - salto * (num - 1);
  }
  if (num <= 1) return [top];
  const paso = (top - primera) / (num - 1);
  const series = Array.from({ length: num - 1 }, (_, i) => redondear05(primera + paso * i));
  return [...series, top];
}
