import { redondear05 } from './numeros';

export function generarRampa(top: number, anterior?: number[]): number[] {
  let n = 5;
  let primera = top * 0.8;
  if (anterior && anterior.length >= 2) {
    n = anterior.length;
    primera = top - (Math.max(...anterior) - anterior[0]);
  }
  const paso = (top - primera) / (n - 1);
  const series = Array.from({ length: n - 1 }, (_, i) => redondear05(primera + paso * i));
  return [...series, top];
}
