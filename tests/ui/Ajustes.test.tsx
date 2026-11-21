import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Ajustes } from '../../src/ui/Ajustes';
import { Inicio } from '../../src/ui/Inicio';
import { estado } from '../../src/store/estado';
import { cargarAjustes, guardarAjustes } from '../../src/store/local';
import { exportarJSON, exportarCSV } from '../../src/domain/exportar';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'token' })) }));

const datos = { version: 1 as const, ejercicios: [], carreras: [], sesiones: [
  { ...sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94]), metcon: { formato: 'AMRAP' as const, resultado: { tipo: 'rondas+reps' as const, valor: '3+200' } } },
] };

beforeEach(async () => { await clear(); estado.datos.value = datos; estado.ultimoResultado.value = null; });

test('exportar JSON no contiene el token', async () => {
  await guardarAjustes({ token: 'ghp_secreto' });
  const j = exportarJSON(datos);
  expect(j).not.toContain('ghp_secreto');
  expect(JSON.parse(j).sesiones).toHaveLength(1);
});

test('exportar CSV: una fila por fuerza con cabecera', () => {
  const lineas = exportarCSV(datos).trim().split('\n');
  expect(lineas[0]).toBe('fecha,ejercicio,variante,reps,kg,tempo,metcon_formato,metcon_resultado');
  expect(lineas[1]).toBe('2026-06-18,back-squat,,5,94,4s+pausa,AMRAP,3+200');
});

test('guardar token y sincronizar muestra el error de token', async () => {
  render(<Ajustes />);
  fireEvent.input(screen.getByLabelText('Token de GitHub'), { target: { value: 'ghp_x' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar token' }));
  await waitFor(async () => expect((await cargarAjustes()).token).toBe('ghp_x'));
  fireEvent.click(screen.getByRole('button', { name: 'Sincronizar ahora' }));
  await screen.findByText('Sin sincronizar: revisa el token');
});

test('inicio muestra la última sesión y el estado de sincronización', () => {
  estado.ultimoResultado.value = { ok: false, motivo: 'token' };
  estado.estadoSync.value = 'error';
  render(<Inicio />);
  expect(screen.getByText(/Back Squat 5×94/)).toBeTruthy();
  expect(screen.getByText(/3\+200/)).toBeTruthy();
  expect(screen.getByText('Sin sincronizar: revisa el token')).toBeTruthy();
});
