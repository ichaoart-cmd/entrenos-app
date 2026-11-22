import { sonar, type Sonido } from '../../src/ui/sonido';

class Nodo { connect(n: unknown) { return n; } }
let creados: string[] = [];
class FakeAC {
  currentTime = 0; state = 'running'; sampleRate = 44100; destination = new Nodo();
  createOscillator() { creados.push('osc'); return Object.assign(new Nodo(), { type: '', frequency: param(), start() {}, stop() {} }); }
  createGain() { return Object.assign(new Nodo(), { gain: param() }); }
  createBiquadFilter() { creados.push('filtro'); return Object.assign(new Nodo(), { type: '', frequency: param(), Q: param() }); }
  createBuffer(_c: number, n: number) { return { getChannelData: () => new Float32Array(n) }; }
  createBufferSource() { creados.push('ruido'); return Object.assign(new Nodo(), { buffer: null, start() {}, stop() {} }); }
  resume() {}
}
const param = () => ({ setValueAtTime() {}, exponentialRampToValueAtTime() {}, linearRampToValueAtTime() {}, value: 0 });

beforeAll(() => { (window as any).AudioContext = FakeAC; Object.defineProperty(navigator, 'vibrate', { value: () => true, configurable: true }); });
beforeEach(() => { creados = []; localStorage.clear(); });

const TODOS: Sonido[] = ['tecla', 'subir', 'bajar', 'activar', 'desactivar', 'pestana', 'principal', 'borrar', 'guardado', 'record', 'descanso', 'cuenta', 'fin'];

test.each(TODOS)('el sonido «%s» se genera sin errores', (s) => {
  expect(() => sonar(s)).not.toThrow();
  expect(creados.length).toBeGreaterThan(0);
});

test('los golpes de disco y el soltar la barra usan ruido además de tonos', () => {
  sonar('borrar'); expect(creados).toContain('ruido');
  creados = []; sonar('descanso'); expect(creados).toContain('ruido');
});

test('el guardado alterna entre variantes', () => {
  const firmas = new Set<string>();
  for (let i = 0; i < 40; i++) { creados = []; sonar('guardado'); firmas.add(creados.join(',')); }
  expect(firmas.size).toBeGreaterThan(1);
});
