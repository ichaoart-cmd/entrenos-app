import { pilaDestino, pasos } from '../../src/ui/navegacion';

test('las pantallas del menú cuelgan siempre del inicio', () => {
  expect(pilaDestino(['#/'], '#/historial')).toEqual(['#/', '#/historial']);
  expect(pilaDestino(['#/', '#/historial'], '#/progreso')).toEqual(['#/', '#/progreso']);
  expect(pilaDestino(['#/', '#/progreso', '#/progreso?ej=back-squat'], '#/')).toEqual(['#/']);
});
test('las subpantallas cuelgan de la pantalla del menú desde la que se abren', () => {
  expect(pilaDestino(['#/', '#/historial'], '#/registrar?id=a')).toEqual(['#/', '#/historial', '#/registrar?id=a']);
  expect(pilaDestino(['#/'], '#/registrar?ej=x')).toEqual(['#/', '#/registrar?ej=x']);
  expect(pilaDestino(['#/', '#/progreso'], '#/progreso?ej=x')).toEqual(['#/', '#/progreso', '#/progreso?ej=x']);
  // De una ficha a otra (o de registrar a carrera) se sustituye, no se apila.
  expect(pilaDestino(['#/', '#/progreso', '#/progreso?ej=x'], '#/progreso?ej=y')).toEqual(['#/', '#/progreso', '#/progreso?ej=y']);
  expect(pilaDestino(['#/', '#/registrar'], '#/carrera')).toEqual(['#/', '#/carrera']);
});
test('una ficha de progreso siempre tiene Progreso debajo', () => {
  expect(pilaDestino(['#/'], '#/progreso?ej=carrera')).toEqual(['#/', '#/progreso', '#/progreso?ej=carrera']);
});
test('pasos: cuánto retroceder y qué apilar', () => {
  expect(pasos(['#/', '#/progreso', '#/progreso?ej=x'], ['#/', '#/historial'])).toEqual({ atras: 2, apilar: ['#/historial'] });
  expect(pasos(['#/'], ['#/', '#/historial'])).toEqual({ atras: 0, apilar: ['#/historial'] });
  expect(pasos(['#/', '#/registrar'], ['#/'])).toEqual({ atras: 1, apilar: [] });
  expect(pasos(['#/', '#/historial'], ['#/', '#/historial'])).toEqual({ atras: 0, apilar: [] });
});
