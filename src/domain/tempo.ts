/** Tempo = segundos de bajada + pausa opcional. Se guarda como texto: '4s+pausa', '3s' o 'sin tempo'. */
export function componerTempo(seg: number | null, pausa: boolean): string {
  if (seg == null) return 'sin tempo';
  return pausa ? `${seg}s+pausa` : `${seg}s`;
}

export function partirTempo(t: string | undefined): { seg: number | null; pausa: boolean } {
  const m = t?.match(/^(\d+)s(\+pausa)?$/);
  return m ? { seg: Number(m[1]), pausa: !!m[2] } : { seg: null, pausa: false };
}
