import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Registrar } from '../../src/ui/Registrar';
import { estado } from '../../src/store/estado';
import { cargarLocal } from '../../src/store/local';
import { fx, sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

const datosCon = (sesiones = fx) => ({ version: 1 as const, ejercicios: [], sesiones, carreras: [] });
const rampa = () => screen.getAllByLabelText(/^Serie \d$/).map((i) => (i as HTMLInputElement).value);

beforeEach(async () => {
  await clear();
  estado.datos.value = datosCon();
  location.hash = '#/registrar';
});

test('preselecciona el ejercicio sugerido y genera la rampa', () => {
  render(<Registrar />);
  expect((screen.getByLabelText('Ejercicio') as HTMLSelectElement).value).toBe('press-banca');
  expect(rampa()).toHaveLength(5);
});

test('con historial usa la última serie top, reps y tempo', () => {
  estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94])]);
  render(<Registrar />);
  fireEvent.change(screen.getByLabelText('Ejercicio'), { target: { value: 'back-squat' } });
  expect((screen.getByLabelText('Serie top (kg)') as HTMLInputElement).value).toBe('94');
  expect((screen.getByLabelText('Reps') as HTMLInputElement).value).toBe('5');
  expect(screen.getByRole('button', { name: '4s+pausa' }).getAttribute('aria-pressed')).toBe('true');
});

test('cambiar la serie top recalcula la rampa', () => {
  estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94])]);
  render(<Registrar />);
  fireEvent.change(screen.getByLabelText('Ejercicio'), { target: { value: 'back-squat' } });
  fireEvent.click(screen.getByRole('button', { name: 'Subir Serie top (kg)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Serie top (kg)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Serie top (kg)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Serie top (kg)' }));
  expect(rampa()).toEqual(['76', '81', '86', '91', '96']);
});

test('acepta kg con coma', () => {
  render(<Registrar />);
  fireEvent.input(screen.getByLabelText('Serie top (kg)'), { target: { value: '82,5' } });
  expect(rampa().at(-1)).toBe('82.5');
});

test('AMRAP guarda resultado rondas+reps', async () => {
  render(<Registrar />);
  fireEvent.click(screen.getByRole('button', { name: '＋ Metcon' }));
  fireEvent.click(screen.getByRole('button', { name: 'AMRAP' }));
  fireEvent.input(screen.getByLabelText('Rondas'), { target: { value: '3' } });
  fireEvent.input(screen.getByLabelText('Reps extra'), { target: { value: '200' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(async () => {
    const s = (await cargarLocal()).sesiones[0];
    expect(s.metcon?.resultado).toEqual({ tipo: 'rondas+reps', valor: '3+200' });
  });
});

test('ForTime guarda tiempo', async () => {
  render(<Registrar />);
  fireEvent.click(screen.getByRole('button', { name: '＋ Metcon' }));
  fireEvent.click(screen.getByRole('button', { name: 'For Time' }));
  fireEvent.input(screen.getByLabelText('Tiempo (mm:ss)'), { target: { value: '11:50' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(async () => expect((await cargarLocal()).sesiones[0]?.metcon?.resultado).toEqual({ tipo: 'tiempo', valor: '11:50' }));
});

test('guardar sin red guarda en local y muestra Guardado', async () => {
  render(<Registrar />);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await screen.findByText(/Guardado/);
  const s = (await cargarLocal()).sesiones;
  expect(s).toHaveLength(1);
  expect(s[0].fuerza[0].ejercicio).toBe('press-banca');
  expect(estado.datos.value.sesiones.map((x) => x.id)).toContain(s[0].id);
});

test('muestra aviso de PR', async () => {
  estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94])]);
  render(<Registrar />);
  fireEvent.change(screen.getByLabelText('Ejercicio'), { target: { value: 'back-squat' } });
  fireEvent.input(screen.getByLabelText('Serie top (kg)'), { target: { value: '96' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await screen.findByText('Nuevo 5RM: 96 kg (+2 kg)');
});

test('se puede quitar la fuerza y guardar solo Metcon', async () => {
  render(<Registrar />);
  fireEvent.click(screen.getByRole('button', { name: 'Quitar fuerza' }));
  fireEvent.click(screen.getByRole('button', { name: '＋ Metcon' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(async () => {
    const s = (await cargarLocal()).sesiones[0];
    expect(s.fuerza).toEqual([]);
    expect(s.metcon?.formato).toBe('AMRAP');
  });
});
