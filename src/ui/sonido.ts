/** Sonidos de la app, sintetizados al vuelo (sin archivos). Cada tipo de acción suena distinto y con una
 * pequeña variación de tono aleatoria para que no canse. Se pueden quitar en Ajustes. */
const CLAVE = 'sonido';
let ctx: AudioContext | null = null;

export const sonidoActivo = () => { try { return localStorage.getItem(CLAVE) !== '0'; } catch { return true; } };
export const activarSonido = (si: boolean) => { try { localStorage.setItem(CLAVE, si ? '1' : '0'); } catch { /* sin almacenamiento */ } };

function audio(): AudioContext | null {
  try {
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const AC = w.AudioContext ?? w.webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

type Onda = OscillatorType;
/** Una nota corta: frecuencia inicial → final, con ataque rápido y caída exponencial. */
function nota(f0: number, dur: number, vol: number, { retraso = 0, f1 = f0, onda = 'triangle' as Onda } = {}) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + retraso, o = a.createOscillator(), g = a.createGain();
  o.type = onda;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
}

const vibrar = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* no soportado */ } };
/** ±4 % de tono al azar. */
const v = (f: number) => f * (0.96 + Math.random() * 0.08);

export type Sonido = 'tecla' | 'subir' | 'bajar' | 'activar' | 'desactivar' | 'pestana' | 'principal' | 'borrar'
  | 'guardado' | 'record' | 'descanso' | 'cuenta' | 'fin';

const SONIDOS: Record<Sonido, () => void> = {
  // Clic seco y cortito.
  tecla: () => nota(v(1500), 0.03, 0.05),
  // Blip que sube / que baja.
  subir: () => nota(v(620), 0.07, 0.07, { f1: 980 }),
  bajar: () => nota(v(900), 0.07, 0.07, { f1: 560 }),
  // «Pop» de dos notas al marcar; al desmarcar, al revés y más suave.
  activar: () => { const b = v(660); nota(b, 0.05, 0.07); nota(b * 1.5, 0.08, 0.07, { retraso: 0.05 }); },
  desactivar: () => { const b = v(990); nota(b, 0.05, 0.05); nota(b / 1.5, 0.07, 0.05, { retraso: 0.05 }); },
  // Toque de madera grave para las pestañas.
  pestana: () => nota(v(320), 0.06, 0.09, { onda: 'sine', f1: 260 }),
  // Botón principal: golpe con cuerpo.
  principal: () => { nota(v(440), 0.08, 0.08, { onda: 'square', f1: 330 }); },
  // Borrar: caída grave.
  borrar: () => nota(180, 0.25, 0.12, { onda: 'sawtooth', f1: 70 }),
  // Guardado: arpegio mayor (do-mi-sol).
  guardado: () => [523, 659, 784].forEach((f, i) => nota(f, 0.16, 0.09, { retraso: i * 0.07 })),
  // Récord: fanfarria corta (sol-do-mi-sol agudo).
  record: () => {
    [392, 523, 659].forEach((f, i) => nota(f, 0.12, 0.1, { retraso: i * 0.08, onda: 'square' }));
    nota(784, 0.45, 0.12, { retraso: 0.26, onda: 'square' });
    nota(1047, 0.45, 0.06, { retraso: 0.26 });
  },
  // Empieza el descanso: barrido hacia arriba.
  descanso: () => nota(300, 0.22, 0.07, { onda: 'sine', f1: 900 }),
  // Últimos 3 segundos.
  cuenta: () => nota(660, 0.09, 0.12, { onda: 'square' }),
  // Fin del descanso: tres pitidos, el último más agudo.
  fin: () => { nota(880, 0.14, 0.22); nota(880, 0.14, 0.22, { retraso: 0.22 }); nota(1320, 0.3, 0.26, { retraso: 0.44 }); },
};

const VIBRACION: Partial<Record<Sonido, number | number[]>> = {
  tecla: 8, subir: 8, bajar: 8, activar: 10, desactivar: 6, pestana: 10, principal: 14, borrar: [30, 40, 60],
  guardado: [12, 50, 12], record: [40, 60, 40, 60, 120], descanso: 12, cuenta: 20, fin: [180, 90, 180, 90, 350],
};

/** Suena (y vibra). El final del descanso suena siempre; lo demás, solo si el sonido está activo. */
export function sonar(s: Sonido): void {
  if (s !== 'fin' && !sonidoActivo()) return;
  const p = VIBRACION[s]; if (p) vibrar(p);
  try { SONIDOS[s](); } catch { /* sin audio */ }
}

export const clic = () => sonar('tecla');
export const avisoFin = () => sonar('fin');

/** Qué sonido corresponde a pulsar este elemento (o null si no es pulsable). */
export function sonidoPara(t: Element | null): Sonido | null {
  const el = t?.closest?.('button, a[href], [role="switch"]');
  if (!el) return null;
  const etiqueta = el.getAttribute('aria-label') ?? '';
  if (etiqueta.startsWith('Subir ')) return 'subir';
  if (etiqueta.startsWith('Bajar ')) return 'bajar';
  if (el.closest('.barra')) return 'pestana';
  if (el.closest('.barra-descanso')) return 'descanso';
  if (el.classList.contains('peligro-lleno')) return 'borrar';
  const marcado = el.getAttribute('aria-pressed') ?? el.getAttribute('aria-checked');
  if (marcado != null) return marcado === 'true' ? 'desactivar' : 'activar';
  if (el.classList.contains('primario')) return 'principal';
  return 'tecla';
}

/** Escucha las pulsaciones en toda la app. */
export function activarClics(): void {
  addEventListener('pointerdown', (e) => {
    const s = sonidoPara(e.target as Element | null);
    if (s) sonar(s);
  }, { passive: true });
}
