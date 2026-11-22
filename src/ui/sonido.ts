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
interface OpcNota { retraso?: number; f1?: number; onda?: Onda; vibrato?: number; profundidad?: number }

/** Una nota: frecuencia inicial → final, ataque rápido y caída exponencial; con vibrato opcional (gomas, silbato). */
function nota(f0: number, dur: number, vol: number, { retraso = 0, f1 = f0, onda = 'triangle', vibrato = 0, profundidad = 0 }: OpcNota = {}) {
  const a = audio(); if (!a) return;
  const t = a.currentTime + retraso, o = a.createOscillator(), g = a.createGain();
  o.type = onda;
  o.frequency.setValueAtTime(f0, t);
  if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
  if (vibrato) {
    const lfo = a.createOscillator(), lg = a.createGain();
    lfo.frequency.setValueAtTime(vibrato, t); lg.gain.setValueAtTime(profundidad, t);
    lfo.connect(lg).connect(o.frequency as unknown as AudioNode); lfo.start(t); lfo.stop(t + dur + 0.03);
  }
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination); o.start(t); o.stop(t + dur + 0.03);
}

/** Ruido filtrado: golpes, soplidos, barridos. */
interface OpcRuido { retraso?: number; tipo?: BiquadFilterType; f0?: number; f1?: number; q?: number }
function ruido(dur: number, vol: number, { retraso = 0, tipo = 'lowpass', f0 = 800, f1, q = 1 }: OpcRuido = {}) {
  f1 ??= f0;
  const a = audio(); if (!a) return;
  const t = a.currentTime + retraso, n = Math.max(1, Math.floor(a.sampleRate * dur));
  const buf = a.createBuffer(1, n, a.sampleRate), d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain();
  src.buffer = buf; f.type = tipo; f.Q.setValueAtTime(q, t);
  f.frequency.setValueAtTime(f0, t); if (f1 !== f0) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f).connect(g).connect(a.destination); src.start(t); src.stop(t + dur + 0.02);
}

/** Golpe metálico de disco: parciales inarmónicas que se apagan despacio. */
function disco(base: number, vol: number, retraso = 0) {
  [1, 2.76, 5.4, 8.93].forEach((m, i) => nota(base * m, 0.5 - i * 0.08, vol / (i + 1.5), { retraso, onda: 'sine' }));
  ruido(0.04, vol * 0.8, { retraso, tipo: 'highpass', f0: 2500 });
}

const vibrar = (p: number | number[]) => { try { navigator.vibrate?.(p); } catch { /* no soportado */ } };
/** ±4 % de tono al azar. */
const v = (f: number) => f * (0.96 + Math.random() * 0.08);
/** Pentatónica (do re mi sol la): las pestañas tocan una nota distinta cada vez y siempre suena bien. */
const PENTA = [523, 587, 659, 784, 880, 1047];
const azar = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

export type Sonido = 'tecla' | 'subir' | 'bajar' | 'activar' | 'desactivar' | 'pestana' | 'principal' | 'borrar'
  | 'guardado' | 'record' | 'descanso' | 'cuenta' | 'fin';

/** Sonidos de box con aire de dibujos animados, a juego con el estilo pop. */
const SONIDOS: Record<Sonido, () => void> = {
  // «Tok» de madera.
  tecla: () => { nota(v(900), 0.04, 0.08, { onda: 'sine', f1: 420 }); },
  // Burbuja que sube / que baja.
  subir: () => nota(v(420), 0.09, 0.09, { onda: 'sine', f1: 1100, vibrato: 40, profundidad: 25 }),
  bajar: () => nota(v(1000), 0.09, 0.09, { onda: 'sine', f1: 380, vibrato: 40, profundidad: 25 }),
  // «Boing» de goma al marcar; al desmarcar, se desinfla.
  activar: () => nota(v(260), 0.18, 0.1, { onda: 'sine', f1: 620, vibrato: 18, profundidad: 60 }),
  desactivar: () => nota(v(560), 0.14, 0.07, { onda: 'sine', f1: 220, vibrato: 14, profundidad: 30 }),
  // Marimba: una nota de la pentatónica al azar.
  pestana: () => { const f = azar(PENTA); nota(f, 0.22, 0.09, { onda: 'sine' }); nota(f * 4, 0.06, 0.03, { onda: 'sine' }); },
  // Botón principal: «chunk» con cuerpo.
  principal: () => { nota(v(150), 0.09, 0.12, { onda: 'square', f1: 90 }); ruido(0.05, 0.06, { f0: 1200 }); },
  // Borrar: la barra que se suelta contra el suelo.
  borrar: () => { nota(95, 0.35, 0.2, { onda: 'sine', f1: 38 }); ruido(0.3, 0.18, { f0: 600, f1: 120 }); disco(180, 0.05, 0.05); },
  // Guardado: alterna entre clank de disco, arpegio de marimba y moneda arcade.
  guardado: () => azar([
    () => { disco(v(420), 0.12); disco(v(560), 0.08, 0.09); },
    () => [523, 659, 784, 1047].forEach((f, i) => { nota(f, 0.2, 0.08, { onda: 'sine', retraso: i * 0.06 }); nota(f * 4, 0.05, 0.02, { onda: 'sine', retraso: i * 0.06 }); }),
    () => { nota(988, 0.08, 0.07, { onda: 'square' }); nota(1319, 0.28, 0.07, { onda: 'square', retraso: 0.08 }); },
  ])(),
  // Récord: fanfarria arcade + destellos + «ovación» de ruido.
  record: () => {
    [392, 523, 659, 784].forEach((f, i) => nota(f, 0.11, 0.09, { retraso: i * 0.07, onda: 'square' }));
    nota(1047, 0.55, 0.1, { retraso: 0.3, onda: 'square', vibrato: 6, profundidad: 12 });
    [2093, 2637, 3136].forEach((f, i) => nota(f, 0.08, 0.03, { retraso: 0.34 + i * 0.07, onda: 'sine' }));
    ruido(0.9, 0.06, { retraso: 0.25, tipo: 'bandpass', f0: 1500, f1: 900, q: 0.6 });
  },
  // «Respira»: soplido que sube.
  descanso: () => { ruido(0.45, 0.09, { tipo: 'bandpass', f0: 400, f1: 1800, q: 1.2 }); },
  // Últimos 3 segundos: pitido de cronómetro.
  cuenta: () => nota(1760, 0.08, 0.1, { onda: 'square' }),
  // Fin: silbato de árbitro y clank.
  fin: () => {
    nota(2300, 0.22, 0.16, { onda: 'sine', vibrato: 32, profundidad: 90 });
    nota(2300, 0.42, 0.18, { onda: 'sine', vibrato: 32, profundidad: 90, retraso: 0.28 });
    disco(440, 0.1, 0.72);
  },
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
  // Solo botones de verdad (y enlaces con pinta de botón); tarjetas, días del calendario y avisos no suenan.
  const el = t?.closest?.('button, [role="switch"], .barra a, a.accion, a.boton, a.hero-ej, a.circulo, a.volver');
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
  // «click» y no «pointerdown»: así no suena al tocar para hacer scroll.
  addEventListener('click', (e) => {
    const s = sonidoPara(e.target as Element | null);
    if (s) sonar(s);
  }, { capture: true, passive: true });
}
