import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Inicio } from '../../src/ui/Inicio';
import { Registrar } from '../../src/ui/Registrar';
import { Progreso } from '../../src/ui/Progreso';
import { estado } from '../../src/store/estado';
import { cargarLocal } from '../../src/store/local';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));
const datosCon = (sesiones: any[]) => ({ version: 1 as const, ejercicios: [], sesiones, carreras: [] });
const rampa = () => screen.getAllByLabelText(/^Serie \d$/).map((i) => (i as HTMLInputElement).value);
const ym = () => { const h = new Date(); return `${h.getFullYear()}-${String(h.getMonth() + 1).padStart(2, '0')}`; };

beforeEach(async () => { await clear(); localStorage.clear(); });

test('la tarjeta grande deja elegir entre tus ejercicios habituales, sin imponer la rotación', () => {
  estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94]), sesion('p', '2026-10-16', 'press-banca', 6, [53, 65])]);
  render(<Inicio />);
  const hero = screen.getByRole('region', { name: '¿A qué le damos caña?' });
  const banca = screen.getByRole('link', { name: /^Press Banca, 65 kg/ });
  expect(hero.contains(banca)).toBe(true);
  expect(banca.getAttribute('href')).toBe('#/registrar?ej=press-banca');
  expect(screen.getByRole('link', { name: 'Otro ejercicio' }).getAttribute('href')).toBe('#/registrar?elegir=1');
  expect(screen.getByRole('link', { name: 'Metcon' }).getAttribute('href')).toBe('#/registrar?metcon=1');
  expect(screen.getByRole('link', { name: 'Carrera' }).getAttribute('href')).toBe('#/carrera');
  expect(hero.textContent).not.toMatch(/rotación/i);
});

test('si ya has entrenado hoy, la tarjeta grande resume lo de hoy', async () => {
  const { hoy } = await import('../../src/ui/Registrar');
  estado.datos.value = datosCon([sesion('h', hoy(), 'back-squat', 5, [90])]);
  render(<Inicio />);
  const hero = screen.getByRole('region', { name: 'Hoy ya has cumplido' });
  expect(hero.textContent).toContain('Back Squat');
  expect(screen.getByRole('link', { name: 'Meter algo más' })).toBeTruthy();
});

test('reto de referencia de la semana enlaza a registrarlo ya rellenado', () => {
  estado.datos.value = datosCon([]);
  render(<Inicio />);
  const reto = screen.getByRole('region', { name: 'El reto de la semana' });
  expect(reto.querySelector('a')!.getAttribute('href')).toMatch(/^#\/registrar\?wod=/);
});

test('el calendario marca en bronce los días de récord', () => {
  estado.datos.value = datosCon([sesion('a', `${ym()}-02`, 'back-squat', 5, [90]), sesion('b', `${ym()}-03`, 'back-squat', 5, [92])]);
  render(<Inicio />);
  expect(screen.getByRole('link', { name: /^3 .*récord/ }).className).toContain('record');
  expect(screen.getByRole('link', { name: /^2 / }).className).not.toContain('record');
});

test('registrar abre con el ejercicio pedido', () => {
  estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94])]);
  render(<Registrar ejercicioInicial='back-squat' />);
  expect(screen.getByRole('button', { name: /Back Squat/ }).getAttribute('aria-pressed')).toBe('true');
});

test('la pausa es un interruptor', async () => {
  estado.datos.value = datosCon([]);
  render(<Registrar />);
  fireEvent.click(screen.getByRole('button', { name: 'Bajada 3 s' }));
  const sw = screen.getByRole('switch', { name: 'Con pausa abajo' });
  expect(sw.getAttribute('aria-checked')).toBe('false');
  fireEvent.click(sw);
  expect(sw.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
  await waitFor(async () => expect((await cargarLocal()).sesiones[0]?.fuerza[0].tempo).toBe('3s+pausa'));
});

test('el número de series se ajusta con su contador', () => {
  estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94])]);
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: 'Bajar Series' }));
  fireEvent.click(screen.getByRole('button', { name: 'Bajar Series' }));
  expect(rampa()).toEqual(['84', '89', '94']);
});

test('progreso muestra el 1RM estimado y los récords de cada ejercicio', () => {
  estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94])]);
  const { unmount } = render(<Progreso />);
  expect(screen.getByRole('link', { name: 'Back Squat' }).textContent).toContain('108'); // e1rm(94,5) = 107,7 → 108
  unmount();
  render(<Progreso ejercicio='back-squat' />);
  expect(screen.getByText('5RM 94 kg')).toBeTruthy();
});
