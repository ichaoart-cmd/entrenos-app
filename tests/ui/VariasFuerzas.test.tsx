import { render, screen, fireEvent, waitFor, within } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Registrar } from '../../src/ui/Registrar';
import { estado } from '../../src/store/estado';
import { cargarLocal, reemplazarDatos } from '../../src/store/local';
import type { Datos, Sesion } from '../../src/domain/types';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));
async function con(sesiones: Sesion[]) {
  await clear(); localStorage.clear();
  const d: Datos = { version: 1, ejercicios: [], sesiones, carreras: [] };
  await reemplazarDatos(d); estado.datos.value = d; estado.listo.value = true;
}

test('se pueden apuntar varios ejercicios de fuerza en la misma sesión', async () => {
  await con([sesion('a', '2026-11-01', 'press-banca', 5, [60]), sesion('b', '2026-11-02', 'back-squat', 5, [90])]);
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: '＋ Otro ejercicio de fuerza' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Press Banca/ }));
  expect(screen.getAllByRole('button', { name: 'Quitar fuerza' })).toHaveLength(2);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar sesión' }));
  await waitFor(async () => expect((await cargarLocal()).sesiones.find((s) => s.fuerza.length === 2)?.fuerza.map((f) => f.ejercicio)).toEqual(['back-squat', 'press-banca']));
});

test('al editar una sesión con dos ejercicios se pueden cambiar los dos y quitar uno', async () => {
  const s: Sesion = { id: 'x', actualizado: '', fecha: '2026-11-03', lugar: 'box', fuerza: [{ ejercicio: 'back-squat', reps: 5, series: [90] }, { ejercicio: 'press-banca', reps: 5, series: [60] }] };
  await con([s]);
  render(<Registrar sesionInicial={s} />);
  expect(screen.getAllByRole('button', { name: 'Quitar fuerza' })).toHaveLength(2);
  fireEvent.click(screen.getAllByRole('button', { name: 'Quitar fuerza' })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Guardar sesión' }));
  await waitFor(async () => expect((await cargarLocal()).sesiones[0].fuerza.map((f) => f.ejercicio)).toEqual(['press-banca']));
});

test('el récord se detecta en cualquiera de los ejercicios y dice cuál', async () => {
  await con([sesion('a', '2026-11-01', 'press-banca', 5, [60]), sesion('b', '2026-11-02', 'back-squat', 5, [90])]);
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: '＋ Otro ejercicio de fuerza' }));
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /^Press Banca/ }));
  const tops = screen.getAllByLabelText('Serie top (kg)');
  fireEvent.input(tops[1], { target: { value: '65' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar sesión' }));
  expect(await screen.findByText(/Press Banca.*5RM a 4 s \+ pausa: 65 kg/)).toBeTruthy();
});
