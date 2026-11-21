import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Registrar } from '../../src/ui/Registrar';
import { Ajustes } from '../../src/ui/Ajustes';
import { estado, sincronizarAhora, iniciar } from '../../src/store/estado';
import { cargarLocal, reemplazarDatos, guardarAjustes } from '../../src/store/local';
import { sincronizar } from '../../src/store/sync';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

beforeEach(async () => {
  await clear(); localStorage.clear(); vi.mocked(sincronizar).mockClear();
  estado.datos.value = { version: 1, ejercicios: [], sesiones: [], carreras: [] };
});

test('quitar la fuerza visible al editar conserva los otros bloques', async () => {
  const s = { ...sesion('m', '2024-02-15', 'deadlift', 3, [89]), fuerza: [
    { ejercicio: 'deadlift', reps: 3, series: [89] }, { ejercicio: 'clean', reps: 3, series: [65] }, { ejercicio: 'snatch', reps: 3, series: [35] }] };
  await reemplazarDatos({ ...estado.datos.value, sesiones: [s] });
  estado.datos.value = { ...estado.datos.value, sesiones: [s] };
  render(<Registrar sesionInicial={s} />);
  expect(screen.getByText(/Clean 3×65/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Quitar fuerza' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await waitFor(async () => {
    const g = (await cargarLocal()).sesiones.find((x) => x.id === 'm')!;
    expect(g.fuerza.map((f) => f.ejercicio)).toEqual(['clean', 'snatch']);
  });
});

test('el borrador del registro sobrevive a salir de la pantalla y se borra al guardar', async () => {
  render(<Registrar />);
  fireEvent.input(screen.getByLabelText('Serie top (kg)'), { target: { value: '77' } });
  cleanup();
  render(<Registrar />);
  expect((screen.getByLabelText('Serie top (kg)') as HTMLInputElement).value).toBe('77');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar' }));
  await screen.findByText(/Guardado/);
  cleanup();
  render(<Registrar />);
  expect((screen.getByLabelText('Serie top (kg)') as HTMLInputElement).value).not.toBe('77');
});

test('sin conexión y sin nada pendiente el estado no es error ni pendiente', async () => {
  await guardarAjustes({ pendiente: false });
  await sincronizarAhora();
  expect(estado.estadoSync.value).toBe('ok');
});

test('sin conexión con datos pendientes el estado es pendiente, no error', async () => {
  await guardarAjustes({ pendiente: true });
  await sincronizarAhora();
  expect(estado.estadoSync.value).toBe('pendiente');
});

test('guardar el token lanza una sincronización', async () => {
  render(<Ajustes />);
  fireEvent.input(screen.getByLabelText('Token de GitHub'), { target: { value: 'ghp_x' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar token' }));
  await waitFor(() => expect(sincronizar).toHaveBeenCalled());
});

test('al volver la app a primer plano se sincroniza', async () => {
  await iniciar();
  await waitFor(() => expect(sincronizar).toHaveBeenCalledTimes(1));
  Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
  document.dispatchEvent(new Event('visibilitychange'));
  await waitFor(() => expect(sincronizar).toHaveBeenCalledTimes(2));
});
