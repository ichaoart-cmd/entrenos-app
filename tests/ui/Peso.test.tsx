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

test('apuntar el peso corporal desde Progreso', async () => {
  await con({});
  render(<Progreso />);
  fireEvent.input(screen.getByLabelText('Peso corporal (kg)'), { target: { value: '79,5' } });
  fireEvent.click(screen.getByRole('button', { name: 'Apuntar peso de hoy' }));
  await waitFor(async () => expect((await cargarLocal()).pesos?.[0]).toMatchObject({ kg: 79.5 }));
});

test('la ficha de un ejercicio muestra la fuerza relativa al peso', async () => {
  await con({ sesiones: [sesion('a', '2026-11-01', 'back-squat', 1, [120])], pesos: [{ id: 'p', actualizado: '', fecha: '2026-10-01', kg: 80 }] });
  render(<Progreso ejercicio='back-squat' />);
  expect(screen.getByText(/1,5 × tu peso/)).toBeTruthy();
});
