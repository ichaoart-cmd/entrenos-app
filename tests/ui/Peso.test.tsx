import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Progreso } from '../../src/ui/Progreso';
import { estado } from '../../src/store/estado';
import { cargarLocal, reemplazarDatos } from '../../src/store/local';
import type { Datos } from '../../src/domain/types';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

async function con(d: Partial<Datos>) {
  await clear();
  const datos: Datos = { version: 1, ejercicios: [], sesiones: [], carreras: [], ...d };
  await reemplazarDatos(datos); estado.datos.value = datos;
}

test('apuntar el peso corporal desde su ficha', async () => {
  await con({});
  render(<Progreso ejercicio='peso' />);
  fireEvent.input(screen.getByLabelText('Peso corporal (kg)'), { target: { value: '79,5' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apuntar peso de hoy' }));
  await waitFor(async () => expect((await cargarLocal()).pesos?.[0]).toMatchObject({ kg: 79.5 }));
});

test('la ficha de un ejercicio muestra la fuerza relativa al peso', async () => {
  await con({ sesiones: [sesion('a', '2026-11-01', 'back-squat', 1, [120])], pesos: [{ id: 'p', actualizado: '', fecha: '2026-10-01', kg: 80 }] });
  render(<Progreso ejercicio='back-squat' />);
  expect(screen.getByText(/1,5 × tu peso/)).toBeTruthy();
});

test('la lista de Progreso enseña el último peso y lleva a su ficha', async () => {
  await con({ pesos: [{ id: 'a', actualizado: '', fecha: '2026-09-01', kg: 82 }, { id: 'b', actualizado: '', fecha: '2026-10-15', kg: 80.4 }] });
  render(<Progreso />);
  const tarjeta = screen.getByRole('link', { name: 'Peso corporal' });
  expect(tarjeta.getAttribute('href')).toBe('#/progreso?ej=peso');
  expect(tarjeta.textContent).toContain('80,4 kg');
  expect(tarjeta.textContent).toContain('−1,6 kg en 30 días');
});

test('la ficha de peso pinta la gráfica, los cambios y la fuerza relativa', async () => {
  const hoy = new Date().toISOString().slice(0, 10);
  const hace = (d: number) => new Date(Date.now() - d * 864e5).toISOString().slice(0, 10);
  await con({
    sesiones: [sesion('a', hace(300), 'back-squat', 1, [100]), sesion('b', hace(5), 'back-squat', 1, [120])],
    pesos: [{ id: 'p1', actualizado: '', fecha: hace(250), kg: 85 }, { id: 'p2', actualizado: '', fecha: hace(40), kg: 81 }, { id: 'p3', actualizado: '', fecha: hoy, kg: 80 }],
  });
  render(<Progreso ejercicio='peso' />);
  fireEvent.click(screen.getByRole('button', { name: 'Todo' }));
  expect(screen.getByRole('img', { name: /Peso corporal: de 85 a 80 kg/ })).toBeTruthy();
  expect(screen.getByText('desde el inicio').parentElement!.textContent).toContain('−5');
  expect(screen.getByText('1,50 ×')).toBeTruthy();
  expect(screen.getByText(/hace 6 meses 1,18 ×/)).toBeTruthy();
});

test('se puede apuntar el peso de otro día', async () => {
  await con({});
  render(<Progreso ejercicio='peso' />);
  fireEvent.input(screen.getByLabelText('Fecha del peso'), { target: { value: '2026-10-03' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apuntar peso' }));
  await waitFor(async () => expect((await cargarLocal()).pesos?.[0]).toMatchObject({ fecha: '2026-10-03' }));
});
