import { render, screen } from '@testing-library/preact';
import { Progreso } from '../../src/ui/Progreso';
import { estado } from '../../src/store/estado';
import { sesion } from '../fixtures/sesiones';
import { hoy } from '../../src/ui/Registrar';

test('Progreso enseña el reparto por tipo de las últimas 4 semanas', () => {
  estado.datos.value = { version: 1, ejercicios: [], sesiones: [sesion('a', hoy(), 'back-squat', 5, [90])], carreras: [] };
  render(<Progreso />);
  const r = screen.getByRole('region', { name: 'Últimas 4 semanas' });
  expect(r.textContent).toContain('Pierna');
  expect(r.textContent).toContain('1 día');
  expect(r.textContent).toContain('450 kg');
});
