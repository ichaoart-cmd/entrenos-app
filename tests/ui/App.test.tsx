import { render, screen } from '@testing-library/preact';
import { App } from '../../src/ui/App';

test('el inicio ofrece empezar a registrar', () => {
  render(<App />);
  expect(screen.getByRole('region', { name: 'Elegir entreno' })).toBeTruthy();
  expect(screen.getByRole('link', { name: 'Otro ejercicio' })).toBeTruthy();
});
