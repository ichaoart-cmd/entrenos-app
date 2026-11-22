/** Clic corto y vibración leve al pulsar; pitidos al acabar el descanso. Se puede quitar en Ajustes. */
const CLAVE = 'sonido';
let ctx: AudioContext | null = null;

export const sonidoActivo = () => { try { return localStorage.getItem(CLAVE) !== '0'; } catch { return true; } };
export const activarSonido = (si: boolean) => { try { localStorage.setItem(CLAVE, si ? '1' : '0'); } catch { /* sin almacenamiento */ } };

function audio(): AudioContext | null {
  try {
    const AC = (window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext }).AudioContext
      ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch { return null; }
}

function pitido(frec: number, dur: number, volumen: number, retraso = 0) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + retraso, o = a.createOscillator(), g = a.createGain();
  o.type = 'triangle'; o.frequency.setValueAtTime(frec, t);
  g.gain.setValueAtTime(volumen, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.02);
}

const vibrar = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* no soportado */ } };

export function clic(): void {
  if (!sonidoActivo()) return;
  vibrar(8);
  pitido(1500, 0.03, 0.06);
}

/** Aviso de fin de descanso: suena y vibra aunque el clic esté quitado (es lo que pediste al ponerlo). */
export function avisoFin(): void {
  vibrar([180, 90, 180, 90, 350]);
  pitido(880, 0.14, 0.25); pitido(880, 0.14, 0.25, 0.22); pitido(1320, 0.3, 0.3, 0.44);
}

/** Escucha las pulsaciones en toda la app (botones, enlaces, chips). */
export function activarClics(): void {
  addEventListener('pointerdown', (e) => {
    const t = e.target as Element | null;
    if (t?.closest?.('button, a[href], [role="switch"], input[type="checkbox"]')) clic();
  }, { passive: true });
}
