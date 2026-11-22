import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Historial } from '../../src/ui/Historial';
import { Registrar } from '../../src/ui/Registrar';
import { estado } from '../../src/store/estado';
import { cargarLocal, reemplazarDatos } from '../../src/store/local';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

const s1 = sesion('a', '2026-06-11', 'back-squat', 5, [72, 77, 82, 87, 92]);
const s2 = sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94]);
const borrada = sesion('z', '2026-07-01', 'deadlift', 5, [100], { borrado: true });

beforeEach(async () => {
  await clear();
  const d = { version: 1 as const, ejercicios: [], sesiones: [s1, s2, borrada], carreras: [] };
  await reemplazarDatos(d);
  estado.datos.value = d;
});

test('ordena de más reciente a más antigua y oculta borradas', () => {
  render(<Historial />);
  const items = screen.getAllByRole('listitem').map((li) => li.textContent);
  expect(items).toHaveLength(2);
  expect(items[0]).toContain('18 jun 2026');
  expect(items[0]).toContain('Back Squat 5×94');
  expect(items[1]).toContain('11 jun 2026');
});

test('borrar pide confirmación en la propia pantalla', async () => {
  render(<Historial />);
  fireEvent.click(screen.getAllByRole('button', { name: 'Borrar' })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));
  await waitFor(async () => expect((await cargarLocal()).sesiones.find((s) => s.id === 'b')?.borrado).toBe(true));
});

test('editar conserva el id', async () => {
  render(<Registrar sesionInicial={s2} />);
  fireEvent.input(screen.getByLabelText('Serie top (kg)'), { target: { value: '95' } });
  fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
  await waitFor(async () => {
    const d = await cargarLocal();
    expect(d.sesiones.filter((s) => s.id === 'b')).toHaveLength(1);
    expect(d.sesiones.find((s) => s.id === 'b')!.fuerza[0].series.at(-1)).toBe(95);
  });
});
