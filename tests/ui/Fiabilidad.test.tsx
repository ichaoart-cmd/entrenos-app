import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Stepper } from '../../src/ui/componentes/Stepper';
import { Registrar } from '../../src/ui/Registrar';
import { App } from '../../src/ui/App';
import { estado } from '../../src/store/estado';
import * as estadoMod from '../../src/store/estado';
import { reemplazarDatos } from '../../src/store/local';
import { textoSync } from '../../src/ui/formato';
import { sesion } from '../fixtures/sesiones';
import type { Datos } from '../../src/domain/types';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

test('stepper: un número no válido se marca y al salir vuelve al último bueno', () => {
  const cambio = vi.fn();
  render(<Stepper etiqueta='Peso' valor={50} paso={1} onCambio={cambio} />);
  const i = screen.getByLabelText('Peso') as HTMLInputElement;
  fireEvent.input(i, { target: { value: '5o' } });
  expect(i.getAttribute('aria-invalid')).toBe('true');
  expect(cambio).not.toHaveBeenCalled();
  fireEvent.blur(i);
  expect(i.value).toBe('50');
  expect(i.getAttribute('aria-invalid')).toBe('false');
});

test('stepper: lo escrito por debajo del mínimo se sube al mínimo', () => {
  const cambio = vi.fn();
  render(<Stepper etiqueta='Reps' valor={5} paso={1} min={1} onCambio={cambio} />);
  const i = screen.getByLabelText('Reps') as HTMLInputElement;
  fireEvent.input(i, { target: { value: '0' } });
  expect(cambio).not.toHaveBeenCalledWith(0);
  fireEvent.blur(i);
  expect(cambio).toHaveBeenLastCalledWith(1);
  expect(i.value).toBe('1');
});

test('si falla el guardado, avisa y deja volver a intentarlo', async () => {
  await clear();
  estado.datos.value = { version: 1, ejercicios: [], sesiones: [], carreras: [] };
  const sp = vi.spyOn(estadoMod, 'registrar').mockRejectedValueOnce(new Error('disco lleno'));
  render(<Registrar />);
  const b = screen.getByRole('button', { name: 'Guardar sesión' }) as HTMLButtonElement;
  fireEvent.click(b);
  expect(await screen.findByText(/No se pudo guardar/)).toBeTruthy();
  await waitFor(() => expect(b.disabled).toBe(false));
  sp.mockRestore();
});

test('un enlace directo a registrar espera a tener los datos', async () => {
  await clear();
  estado.listo.value = false;
  estado.datos.value = { version: 1, ejercicios: [], sesiones: [], carreras: [] };
  location.hash = '#/registrar?ej=back-squat';
  render(<App />);
  const d: Datos = { version: 1, ejercicios: [], sesiones: [sesion('a', '2026-11-01', 'back-squat', 5, [74, 79, 84, 89, 94])], carreras: [] };
  await reemplazarDatos(d);
  estado.datos.value = d;
  estado.listo.value = true;
  await waitFor(() => expect(screen.getByText('Objetivo 94 × 5')).toBeTruthy());
  location.hash = '#/';
});

test('texto cuando GitHub nos limita', () => {
  expect(textoSync('pendiente', { ok: false, motivo: 'limite' })).toMatch(/GitHub/);
  expect(textoSync('pendiente', { ok: false, motivo: 'limite' })).not.toMatch(/token/);
});
