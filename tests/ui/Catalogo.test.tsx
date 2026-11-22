import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Registrar } from '../../src/ui/Registrar';
import { Progreso } from '../../src/ui/Progreso';
import { estado } from '../../src/store/estado';
import { cargarLocal } from '../../src/store/local';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));
const datosCon = (sesiones: any[]) => ({ version: 1 as const, ejercicios: [], sesiones, carreras: [] });
beforeEach(async () => { await clear(); localStorage.clear(); });

test('desde "Más" se busca y elige cualquier ejercicio del catálogo', async () => {
  estado.datos.value = datosCon([]);
  render(<Registrar />);
  fireEvent.click(screen.getByRole('button', { name: 'Más ejercicios' }));
  fireEvent.input(screen.getByRole('searchbox', { name: 'Buscar ejercicio' }), { target: { value: 'thrus' } });
  fireEvent.click(screen.getByRole('button', { name: 'Thruster' }));
  expect(screen.queryByRole('searchbox')).toBeNull();
  expect(screen.getByRole('button', { name: 'Thruster' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
  await waitFor(async () => expect((await cargarLocal()).sesiones[0]?.fuerza[0].ejercicio).toBe('thruster'));
});

test('los ejercicios usados recientemente aparecen en la fila', () => {
  estado.datos.value = datosCon([sesion('t', '2026-11-01', 'thruster', 5, [60])]);
  render(<Registrar />);
  expect(screen.getByRole('button', { name: 'Thruster' })).toBeTruthy();
});

test('las variantes son las del ejercicio elegido', () => {
  estado.datos.value = datosCon([]);
  render(<Registrar ejercicioInicial='press-banca' />);
  expect(screen.queryByRole('button', { name: 'Tras nuca' })).toBeNull();
  expect(screen.getByRole('button', { name: 'Agarre cerrado' })).toBeTruthy();
});

test('sin variantes posibles no se muestra el selector de variante', () => {
  estado.datos.value = datosCon([]);
  render(<Registrar ejercicioInicial='thruster' />);
  expect(screen.queryByRole('group', { name: 'Variante' })).toBeNull();
});

test('cada ejercicio de progreso enlaza a su gráfica', () => {
  estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [94])]);
  render(<Progreso />);
  expect(screen.getByRole('link', { name: /Back Squat/ }).getAttribute('href')).toBe('#/progreso?ej=back-squat');
});

test('la ficha de un ejercicio muestra la gráfica y la tabla de datos', () => {
  estado.datos.value = datosCon([sesion('a', '2026-06-11', 'back-squat', 5, [92]), sesion('b', '2026-06-18', 'back-squat', 5, [94])]);
  render(<Progreso ejercicio='back-squat' />);
  expect(screen.getByRole('img', { name: /Back Squat/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ver datos' }));
  const filas = screen.getAllByRole('row');
  expect(filas.length).toBe(3); // cabecera + 2 sesiones
  expect(filas[1].textContent).toContain('94');
});
