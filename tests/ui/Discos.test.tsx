import { render, screen, fireEvent } from '@testing-library/preact';
import { Discos } from '../../src/ui/Discos';
import { estado } from '../../src/store/estado';
import type { Datos } from '../../src/domain/types';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

beforeEach(() => { try { localStorage.clear(); } catch { /* */ } });

test('dice qué discos cargar por lado y cambia con la barra', () => {
  estado.datos.value = { version: 1, ejercicios: [], sesiones: [], carreras: [] } as Datos;
  render(<Discos kg={100} />);
  expect(screen.getByText('25 + 15')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: '15 kg' }));
  expect(screen.getByText('25 + 15 + 2,5')).toBeTruthy();
});

test('la tabla de porcentajes sale del 1RM y una fila se monta arriba', () => {
  estado.datos.value = { version: 1, ejercicios: [], sesiones: [sesion('a', '2026-11-01', 'back-squat', 1, [100])], carreras: [] } as Datos;
  render(<Discos ej='back-squat' />);
  const fila = screen.getByRole('button', { name: /^80 %/ });
  expect(fila.textContent).toContain('80 kg');
  fireEvent.click(fila);
  expect(document.querySelector('.por-lado b')!.textContent).toBe('25 + 5');
  expect(fila.getAttribute('aria-pressed')).toBe('true');
});
