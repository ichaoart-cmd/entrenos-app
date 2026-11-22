import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Registrar } from '../../src/ui/Registrar';
import { Inicio } from '../../src/ui/Inicio';
import { estado } from '../../src/store/estado';
import { cargarLocal } from '../../src/store/local';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));
const datosCon = (sesiones: any[]) => ({ version: 1 as const, ejercicios: [], sesiones, carreras: [] });
const valores = () => screen.getAllByLabelText(/^Serie \d$/).map((i) => (i as HTMLInputElement).value);
beforeEach(async () => { await clear(); localStorage.clear(); estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94])]); });

test('cambiar una serie concreta respeta el valor y desactiva el cálculo automático', () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  const auto = screen.getByRole('switch', { name: 'Calcular aproximación' });
  expect(auto.getAttribute('aria-checked')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Subir Serie 2' }));
  expect(valores()).toEqual(['74', '80', '84', '89', '94']);
  expect(auto.getAttribute('aria-checked')).toBe('false');
  // Con el cálculo apagado, subir la top solo cambia la última serie
  fireEvent.click(screen.getByRole('button', { name: 'Subir Serie top (kg)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Serie top (kg)' }));
  expect(valores()).toEqual(['74', '80', '84', '89', '95']);
});

test('se puede escribir el peso de cada serie con decimales', async () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.input(screen.getByLabelText('Serie 1'), { target: { value: '72,5' } });
  fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
  await waitFor(async () => expect((await cargarLocal()).sesiones.find((s) => s.id !== 'b')?.fuerza[0].series[0]).toBe(72.5));
});

test('volver a encender el cálculo rehace la aproximación', () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: 'Subir Serie 2' }));
  fireEvent.click(screen.getByRole('switch', { name: 'Calcular aproximación' }));
  expect(valores()).toEqual(['74', '79', '84', '89', '94']);
});

test('en manual, añadir una serie la mete antes de la top y quitar elimina la más ligera', () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('switch', { name: 'Calcular aproximación' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Series' }));
  expect(valores()).toEqual(['74', '79', '84', '89', '89', '94']);
  fireEvent.click(screen.getByRole('button', { name: 'Bajar Series' }));
  fireEvent.click(screen.getByRole('button', { name: 'Bajar Series' }));
  expect(valores()).toEqual(['84', '89', '89', '94']);
});

test('al editar una sesión guardada el cálculo empieza apagado', () => {
  render(<Registrar sesionInicial={estado.datos.value.sesiones[0]} />);
  expect(screen.getByRole('switch', { name: 'Calcular aproximación' }).getAttribute('aria-checked')).toBe('false');
});

test('Hoy toca ofrece elegir otro ejercicio', () => {
  render(<Inicio />);
  expect(screen.getByRole('link', { name: 'Otro ejercicio' }).getAttribute('href')).toBe('#/registrar?elegir=1');
});

test('registrar con elegir abre el catálogo', () => {
  render(<Registrar abrirSelector />);
  expect(screen.getByRole('searchbox', { name: 'Buscar ejercicio' })).toBeTruthy();
});

test('cada serie puede llevar sus propias repeticiones', async () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: 'Subir Reps serie 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Reps serie 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Reps serie 1' }));
  fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
  await waitFor(async () => {
    const f = (await cargarLocal()).sesiones.find((s) => s.id !== 'b')!.fuerza[0];
    expect(f.repsSeries).toEqual([8, 5, 5, 5, 5]);
    expect(f.reps).toBe(5);
  });
});

test('cambiar las reps generales las aplica a todas las series', () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: 'Subir Reps serie 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Bajar Reps' }));
  expect(screen.getAllByLabelText(/^Reps serie \d$/).map((i) => (i as HTMLInputElement).value)).toEqual(['4', '4', '4', '4', '4']);
});
