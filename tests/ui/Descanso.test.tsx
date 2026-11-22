import { render, screen, fireEvent, act } from '@testing-library/preact';
import { Descanso } from '../../src/ui/Descanso';
import { descanso, iniciarDescanso, pararDescanso, restanteSeg } from '../../src/store/descanso';
import { clic, sonidoActivo, activarSonido } from '../../src/ui/sonido';
import { Ajustes } from '../../src/ui/Ajustes';

beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date('2026-11-22T10:00:00Z')); pararDescanso(); localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); });

test('la cuenta atrás se calcula por la hora de fin (aguanta pantalla bloqueada)', () => {
  iniciarDescanso(90);
  expect(restanteSeg()).toBe(90);
  vi.setSystemTime(new Date('2026-11-22T10:01:00Z'));
  expect(restanteSeg()).toBe(30);
  expect(localStorage.getItem('descanso-seg')).toBe('90');
});

test('el temporizador flotante cuenta, suma 30 s, y al acabar vibra y avisa', () => {
  const vib = vi.fn(); Object.defineProperty(navigator, 'vibrate', { value: vib, configurable: true });
  render(<Descanso />);
  act(() => iniciarDescanso(60));
  expect(screen.getByRole('timer').textContent).toContain('1:00');
  fireEvent.click(screen.getByRole('button', { name: 'Sumar 30 segundos' }));
  expect(screen.getByRole('timer').textContent).toContain('1:30');
  act(() => { vi.setSystemTime(new Date('2026-11-22T10:01:31Z')); vi.advanceTimersByTime(500); });
  expect(screen.getByText(/A por la siguiente/)).toBeTruthy();
  expect(vib).toHaveBeenCalled();
  act(() => { vi.advanceTimersByTime(4000); });
  expect(screen.queryByRole('timer')).toBeNull();
  expect(descanso.value).toBeNull();
});

test('se puede cancelar', () => {
  render(<Descanso />);
  act(() => iniciarDescanso(60));
  fireEvent.click(screen.getByRole('button', { name: 'Parar descanso' }));
  expect(screen.queryByRole('timer')).toBeNull();
});

test('sonido al pulsar: se puede quitar en Ajustes', () => {
  const vib = vi.fn(); Object.defineProperty(navigator, 'vibrate', { value: vib, configurable: true });
  expect(sonidoActivo()).toBe(true);
  clic();
  expect(vib).toHaveBeenCalledTimes(1);
  render(<Ajustes />);
  fireEvent.click(screen.getByRole('switch', { name: 'Sonido y vibración al pulsar' }));
  expect(sonidoActivo()).toBe(false);
  clic();
  expect(vib).toHaveBeenCalledTimes(1);
  activarSonido(true);
});

test('los 3 últimos segundos del descanso suenan', () => {
  const vib = vi.fn(); Object.defineProperty(navigator, 'vibrate', { value: vib, configurable: true });
  render(<Descanso />);
  act(() => iniciarDescanso(10));
  act(() => { vi.setSystemTime(new Date('2026-11-22T10:00:07.5Z')); vi.advanceTimersByTime(250); });
  act(() => { vi.setSystemTime(new Date('2026-11-22T10:00:08.5Z')); vi.advanceTimersByTime(250); });
  act(() => { vi.setSystemTime(new Date('2026-11-22T10:00:09.5Z')); vi.advanceTimersByTime(250); });
  expect(vib.mock.calls.filter((c) => c[0] === 20)).toHaveLength(3);
});
