import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Registrar } from '../../src/ui/Registrar';
import { RegistrarCarrera } from '../../src/ui/RegistrarCarrera';
import { estado } from '../../src/store/estado';
import { cargarLocal, reemplazarDatos } from '../../src/store/local';
import type { Datos, Sesion } from '../../src/domain/types';
import { hoy } from '../../src/ui/Registrar';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));
async function con(sesiones: Sesion[]) {
  await clear(); localStorage.clear();
  const d: Datos = { version: 1, ejercicios: [], sesiones, carreras: [] };
  await reemplazarDatos(d); estado.datos.value = d; estado.listo.value = true;
}

test('apuntar una molestia al registrar la sesión', async () => {
  await con([]);
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: 'Rodilla' }));
  expect(screen.getByRole('button', { name: 'Rodilla' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Guardar sesión' }));
  await waitFor(async () => expect((await cargarLocal()).sesiones[0].molestias).toEqual(['rodilla']));
});

test('aviso al registrar un ejercicio que carga una zona con molestia reciente', async () => {
  await con([{ id: 'x', actualizado: '', fecha: hoy(), lugar: 'box', fuerza: [], molestias: ['hombro'] }]);
  render(<Registrar ejercicioInicial='press-banca' />);
  expect(screen.getByRole('note').textContent).toMatch(/molestia en el hombro/i);
});

test('sin aviso si el ejercicio no carga esa zona', async () => {
  await con([{ id: 'x', actualizado: '', fecha: hoy(), lugar: 'box', fuerza: [], molestias: ['hombro'] }]);
  render(<Registrar ejercicioInicial='deadlift' />);
  expect(screen.queryByRole('note')).toBeNull();
});

test('molestias también en la carrera', async () => {
  await con([]);
  render(<RegistrarCarrera />);
  fireEvent.click(screen.getByRole('button', { name: 'Tobillo' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar carrera' }));
  await waitFor(async () => expect((await cargarLocal()).carreras[0].molestias).toEqual(['tobillo']));
});
