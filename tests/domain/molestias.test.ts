import { molestiasRecientes, zonasQueCarga } from '../../src/domain/molestias';
import type { Carrera, Sesion } from '../../src/domain/types';

const ses = (id: string, fecha: string, molestias?: string[]): Sesion => ({ id, actualizado: '', fecha, lugar: 'box', fuerza: [], ...(molestias ? { molestias } : {}) });
const run = (fecha: string, molestias: string[]): Carrera => ({ id: 'c' + fecha, actualizado: '', fecha, distanciaKm: 5, tiempoSeg: 1500, molestias });

test('molestias de las últimas 2 semanas, la más reciente por zona', () => {
  const r = molestiasRecientes([ses('a', '2026-11-10', ['hombro']), ses('b', '2026-11-18', ['hombro', 'rodilla']), ses('c', '2026-10-01', ['codo'])],
    [run('2026-11-20', ['rodilla'])], '2026-11-22');
  expect(r).toEqual([{ zona: 'rodilla', fecha: '2026-11-20' }, { zona: 'hombro', fecha: '2026-11-18' }]);
});
test('se puede excluir la sesión que se está editando', () => {
  expect(molestiasRecientes([ses('a', '2026-11-20', ['hombro'])], [], '2026-11-22', 'a')).toEqual([]);
});
test('qué zonas carga cada ejercicio', () => {
  expect(zonasQueCarga('press-banca')).toContain('hombro');
  expect(zonasQueCarga('back-squat')).toContain('rodilla');
  expect(zonasQueCarga('correr')).toContain('rodilla');
  expect(zonasQueCarga('back-squat')).not.toContain('hombro');
});
