import { calcularLogros } from '../../src/domain/logros';
import type { Datos } from '../../src/domain/types';
import { sesion } from '../fixtures/sesiones';

const base: Datos = { version: 1, ejercicios: [], sesiones: [], carreras: [] };
const de = (d: Datos, id: string) => calcularLogros(d, 3).find((l) => l.id === id)!;

test('sin datos no hay nada desbloqueado y se ve cuánto falta', () => {
  const ls = calcularLogros(base, 3);
  expect(ls.every((l) => l.fecha == null)).toBe(true);
  expect(de(base, 'entrenos-50').progreso).toEqual({ actual: 0, meta: 50 });
});

test('fuerza relativa con el peso de ese día', () => {
  const d: Datos = { ...base,
    sesiones: [sesion('a', '2026-03-01', 'back-squat', 1, [110]), sesion('b', '2026-06-01', 'back-squat', 1, [120])],
    pesos: [{ id: 'p', actualizado: '', fecha: '2026-01-01', kg: 80 }] };
  expect(de(d, 'squat-1-5').fecha).toBe('2026-06-01');
  expect(de(d, 'squat-2').fecha).toBeNull();
  expect(de(d, 'squat-2').progreso.actual).toBe(1.5);
  expect(de(d, 'club-100').fecha).toBe('2026-03-01');
});

test('racha de semanas seguidas con el mínimo de días', () => {
  const dias = ['2026-01-05', '2026-01-06', '2026-01-07', '2026-01-12', '2026-01-13', '2026-01-14', '2026-01-19', '2026-01-20', '2026-01-21', '2026-01-26', '2026-01-27', '2026-01-28'];
  const d: Datos = { ...base, sesiones: dias.map((f, i) => sesion(`s${i}`, f, 'back-squat', 5, [60])) };
  expect(de(d, 'racha-4').fecha).toBe('2026-01-28');
  const conHueco: Datos = { ...d, sesiones: d.sesiones.filter((s) => !s.fecha.startsWith('2026-01-1')) };
  expect(de(conHueco, 'racha-4').fecha).toBeNull();
});

test('los récords cuentan desde la segunda vez y la carrera por distancia', () => {
  const ses = [60, 65, 70].map((kg, i) => sesion(`s${i}`, `2026-0${i + 1}-01`, 'deadlift', 5, [kg]));
  expect(de({ ...base, sesiones: ses }, 'records-10').progreso.actual).toBe(2);
  const d: Datos = { ...base, carreras: [{ id: 'c', actualizado: '', fecha: '2026-05-01', tipo: 'rodaje', distanciaKm: 10.02, tiempoSeg: 3000 } as any] };
  expect(de(d, 'run-10').fecha).toBe('2026-05-01');
  expect(de(d, 'run-21').progreso.actual).toBe(10);
});
