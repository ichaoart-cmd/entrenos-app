const epley = (kg: number, r: number) => kg * (1 + r / 30);
const brzycki = (kg: number, r: number) => (kg * 36) / (37 - r);

/** 1RM estimado: media de Epley y Brzycki. */
export function e1rm(kg: number, reps: number): number {
  if (reps <= 1) return kg;
  return (epley(kg, reps) + brzycki(kg, reps)) / 2;
}

/** Peso estimado para `reps` repeticiones a partir de un 1RM. */
export function rmEstimado(unoRM: number, reps: number): number {
  if (reps <= 1) return unoRM;
  return (unoRM / (1 + reps / 30) + (unoRM * (37 - reps)) / 36) / 2;
}

export function esFiable(reps: number): boolean {
  return reps <= 10;
}
