import { signal } from '@preact/signals';

/** Hora (ms) a la que termina el descanso en curso; null si no hay. Se calcula por hora de fin, así aguanta que la pantalla se bloquee. */
export const descanso = signal<number | null>(null);
const CLAVE = 'descanso-seg';

export function duracionPreferida(): number {
  try { return Number(localStorage.getItem(CLAVE)) || 120; } catch { return 120; }
}

export function iniciarDescanso(seg = duracionPreferida()): void {
  try { localStorage.setItem(CLAVE, String(seg)); } catch { /* sin almacenamiento */ }
  descanso.value = Date.now() + seg * 1000;
}
export const sumarDescanso = (seg: number) => { if (descanso.value) descanso.value += seg * 1000; };
export const pararDescanso = () => { descanso.value = null; };
export const restanteSeg = () => (descanso.value ? Math.max(0, Math.ceil((descanso.value - Date.now()) / 1000)) : 0);
