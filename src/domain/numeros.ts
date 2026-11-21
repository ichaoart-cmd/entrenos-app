export function parsearKg(texto: string): number | null {
  const t = texto.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(t)) return null;
  return Number(t);
}

export function redondear05(kg: number): number {
  return Math.round(kg * 2) / 2;
}
