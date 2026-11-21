import { render, screen } from '@testing-library/preact';
import { App } from '../../src/ui/App';

test('muestra el botón Registrar en inicio', () => {
  render(<App />);
  expect(screen.getByRole('link', { name: /registrar/i })).toBeTruthy();
});
