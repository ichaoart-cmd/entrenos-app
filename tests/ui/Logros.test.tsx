import { render, screen, waitFor, cleanup } from '@testing-library/preact';
import { CelebracionLogro, Vitrina } from '../../src/ui/Logros';
import { estado } from '../../src/store/estado';
import type { Datos } from '../../src/domain/types';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

const con = (sesiones: Datos['sesiones']) => { estado.datos.value = { version: 1, ejercicios: [], sesiones, carreras: [] }; estado.listo.value = true; };

test('la primera vez presenta la sección; luego celebra solo lo nuevo', async () => {
  localStorage.clear();
  con([sesion('a', '2026-01-01', 'back-squat', 5, [60])]);
  render(<CelebracionLogro />);
  await waitFor(() => expect(screen.getByText('¡NUEVA SECCIÓN: LOGROS!')).toBeTruthy());
  cleanup();
  con([sesion('a', '2026-01-01', 'back-squat', 5, [60]), sesion('b', '2026-01-08', 'deadlift', 1, [100])]);
  render(<CelebracionLogro />);
  await waitFor(() => expect(screen.getByText('¡LOGRO DESBLOQUEADO!')).toBeTruthy());
  expect(screen.getByText('Club de los 100')).toBeTruthy();
  cleanup();
  render(<CelebracionLogro />);
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('la vitrina enseña el marcador y lo que falta', () => {
  con([sesion('a', '2026-01-01', 'back-squat', 5, [60])]);
  render(<Vitrina />);
  expect(screen.getByText('HI-SCORE')).toBeTruthy();
  expect(screen.getByLabelText('Insert coin, conseguido')).toBeTruthy();
  expect(screen.getByLabelText('Centurión, bloqueado').textContent).toContain('1/100');
});
