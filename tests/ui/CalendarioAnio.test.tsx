import { render, screen, fireEvent } from '@testing-library/preact';
import { Calendario } from '../../src/ui/Calendario';
import { sesion } from '../fixtures/sesiones';
import { hoy } from '../../src/ui/Registrar';

test('vista año: 12 meses con los días entrenados; tocar un mes vuelve a la vista mes', () => {
  const h = hoy();
  render(<Calendario sesiones={[sesion('a', h, 'back-squat', 5, [90])]} minSemana={3} />);
  fireEvent.click(screen.getByRole('button', { name: 'Año' }));
  expect(screen.getAllByRole('button', { name: /^Ver / })).toHaveLength(12);
  expect(screen.getByLabelText(new RegExp(`^${Number(h.slice(8))} .*Pierna`))).toBeTruthy();
  expect(screen.getByText(/días entrenados en/)).toBeTruthy();
  fireEvent.click(screen.getAllByRole('button', { name: /^Ver / })[0]);
  expect(screen.getByRole('button', { name: 'Mes anterior' })).toBeTruthy();
});
