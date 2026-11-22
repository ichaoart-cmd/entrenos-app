import { render } from '@testing-library/preact';
import { IconoEjercicio, ilustracionDe } from '../../src/ui/iconos';

test('los ejercicios con ilustración usan su imagen', () => {
  expect(ilustracionDe('back-squat')).toBe('sentadilla');
  expect(ilustracionDe('front-squat')).toBe('sentadilla');
  expect(ilustracionDe('snatch')).toBe('overhead');
  expect(ilustracionDe('dominadas')).toBe('dominadas');
  expect(ilustracionDe('kb-swing')).toBe('kb-swing');
  expect(ilustracionDe('dips')).toBe('anillas');
  expect(ilustracionDe('metcon')).toBe('wall-ball');
  const { container } = render(<IconoEjercicio id='back-squat' size={40} />);
  const img = container.querySelector('img')!;
  expect(img.getAttribute('src')).toMatch(/ilustraciones\/sentadilla\.webp$/);
  expect(img.getAttribute('alt')).toBe('');
});
test('sin ilustración se queda el pictograma', () => {
  expect(ilustracionDe('press-banca')).toBeNull();
  const { container } = render(<IconoEjercicio id='press-banca' size={40} />);
  expect(container.querySelector('svg')).toBeTruthy();
});
