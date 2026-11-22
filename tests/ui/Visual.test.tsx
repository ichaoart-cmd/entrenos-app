import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Registrar } from '../../src/ui/Registrar';
import { Inicio } from '../../src/ui/Inicio';
import { estado } from '../../src/store/estado';
import { cargarLocal } from '../../src/store/local';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

const datosCon = (sesiones: any[]) => ({ version: 1 as const, ejercicios: [], sesiones, carreras: [] });
const rampa = () => screen.getAllByLabelText(/^Serie \d$/).map((i) => (i as HTMLInputElement).value);

beforeEach(async () => { await clear(); localStorage.clear(); });

test('el ejercicio se elige tocando su tarjeta', () => {
  estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94])]);
  render(<Registrar />);
  const tarjeta = screen.getByRole('button', { name: /Back Squat/ });
  expect(tarjeta.textContent).toContain('94');
  fireEvent.click(tarjeta);
  expect(tarjeta.getAttribute('aria-pressed')).toBe('true');
  expect((screen.getByLabelText('Serie top (kg)') as HTMLInputElement).value).toBe('94');
});

test('elegir 3 series recalcula la rampa', () => {
  estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94])]);
  render(<Registrar />);
  fireEvent.click(screen.getByRole('button', { name: /Back Squat/ }));
  fireEvent.click(screen.getByRole('button', { name: '3 series' }));
  expect(rampa()).toEqual(['84', '89', '94']);
});

test('tempo: segundos de bajada y luego pausa', async () => {
  estado.datos.value = datosCon([]);
  render(<Registrar />);
  fireEvent.click(screen.getByRole('button', { name: 'Bajada 4 s' }));
  fireEvent.click(screen.getByRole('button', { name: 'Con pausa' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(async () => expect((await cargarLocal()).sesiones[0]?.fuerza[0].tempo).toBe('4s+pausa'));
});

test('sin tempo desactiva la pausa', () => {
  estado.datos.value = datosCon([]);
  render(<Registrar />);
  fireEvent.click(screen.getByRole('button', { name: 'Sin tempo' }));
  expect((screen.getByRole('button', { name: 'Con pausa' }) as HTMLButtonElement).disabled).toBe(true);
});

test('inicio muestra el calendario del mes con los días entrenados', () => {
  const hoy = new Date();
  const ym = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  estado.datos.value = datosCon([sesion('a', `${ym}-02`, 'back-squat', 5, [90])]);
  render(<Inicio />);
  const dia = screen.getByRole('link', { name: /^2 .*Back Squat/ });
  expect(dia.getAttribute('href')).toBe('#/registrar?id=a');
  expect(screen.getByText(/este mes/i).textContent).toMatch(/^1 sesión/);
});

test('tocar un día sin sesión abre el registro con esa fecha', () => {
  const hoy = new Date();
  const ym = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  estado.datos.value = datosCon([]);
  render(<Inicio />);
  expect(screen.getByRole('link', { name: /^1$/ }).getAttribute('href')).toBe(`#/registrar?fecha=${ym}-01`);
});
