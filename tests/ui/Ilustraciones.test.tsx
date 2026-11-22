import { render } from '@testing-library/preact';
import { IconoEjercicio, ilustracionDe } from '../../src/ui/iconos';

test('los ejercicios con ilustración usan su imagen', () => {
  expect(ilustracionDe('back-squat')).toBe('sentadilla');
  expect(ilustracionDe('snatch')).toBe('overhead');
  expect(ilustracionDe('dominadas')).toBe('dominadas');
  expect(ilustracionDe('kb-swing')).toBe('kb-swing');
  expect(ilustracionDe('dips')).toBe('anillas');
  expect(ilustracionDe('metcon')).toBe('wall-ball');
  expect(ilustracionDe('press-banca')).toBe('press-banca');
  expect(ilustracionDe('shoulder-press')).toBe('press-hombro');
  expect(ilustracionDe('deadlift')).toBe('peso-muerto');
  expect(ilustracionDe('power-clean')).toBe('clean');
  expect(ilustracionDe('split-jerk')).toBe('split-jerk');
  expect(ilustracionDe('walking-lunge')).toBe('zancada');
  expect(ilustracionDe('remo-barra')).toBe('remo-barra');
  expect(ilustracionDe('thruster')).toBe('thruster');
  expect(ilustracionDe('front-squat')).toBe('thruster');
  expect(ilustracionDe('correr')).toBe('correr');
  const { container } = render(<IconoEjercicio id='back-squat' size={40} />);
  const img = container.querySelector('img')!;
  expect(img.getAttribute('src')).toMatch(/ilustraciones\/sentadilla\.webp$/);
  expect(img.getAttribute('alt')).toBe('');
});
test('sin ilustración se queda el pictograma', () => {
  expect(ilustracionDe('inventado')).toBeNull();
  const { container } = render(<IconoEjercicio id='inventado' size={40} />);
  expect(container.querySelector('svg')).toBeTruthy();
});

test('todos los ejercicios del catálogo tienen ilustración', async () => {
  const { CATALOGO } = await import('../../src/domain/catalogo');
  expect(CATALOGO.filter((e) => !ilustracionDe(e.id)).map((e) => e.id)).toEqual([]);
});
