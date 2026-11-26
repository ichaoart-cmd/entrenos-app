import { resumenMes } from '../../src/domain/resumen';
import type { Datos } from '../../src/domain/types';
import { sesion } from '../fixtures/sesiones';

test('resumen del mes: días, récords, km, volumen y peso', () => {
  const d: Datos = { version: 1, ejercicios: [],
    sesiones: [sesion('a', '2026-10-10', 'back-squat', 5, [80]), sesion('b', '2026-11-03', 'back-squat', 5, [85]), sesion('c', '2026-11-05', 'deadlift', 5, [100]),
      sesion('m', '2026-11-07', 'back-squat', 5, [], { fuerza: [], metcon: { formato: 'AMRAP', rx: true } as any })],
    carreras: [{ id: 'r', actualizado: '', fecha: '2026-11-03', tipo: 'rodaje', distanciaKm: 5.5, tiempoSeg: 1700 } as any, { id: 'q', actualizado: '', fecha: '2026-11-20', tipo: 'rodaje', distanciaKm: 4, tiempoSeg: 1300 } as any],
    pesos: [{ id: 'p0', actualizado: '', fecha: '2026-10-20', kg: 81 }, { id: 'p1', actualizado: '', fecha: '2026-11-25', kg: 79.8 }] };
  const r = resumenMes(d, '2026-11');
  expect(r.dias).toBe(4);               // 3, 5, 7 y 20 (el 3 cuenta una vez)
  expect(r.diasMesAnterior).toBe(1);
  expect([r.fuerza, r.metcons, r.carreras, r.km]).toEqual([2, 1, 2, 9.5]);
  expect(r.records).toEqual([{ ejercicio: 'back-squat', kg: 85, reps: 5 }]); // el peso muerto es la primera vez
  expect(r.volumenKg).toBe(85 * 5 + 100 * 5);
  expect(r.pesoCambio).toBe(-1.2);
});
