import type { Sesion } from '../../src/domain/types';

export function sesion(id: string, fecha: string, ejercicio: string, reps: number, series: number[], extra: Partial<Sesion> = {}): Sesion {
  return { id, actualizado: `${fecha}T20:00:00.000Z`, fecha, lugar: 'box', fuerza: [{ ejercicio, reps, series, tempo: '4s+pausa' }], ...extra };
}

export const fx: Sesion[] = [
  sesion('a', '2026-06-11', 'back-squat', 5, [72, 77, 82, 87, 92]),
  sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94]),
  sesion('c', '2025-11-24', 'back-squat', 8, [80, 88, 96]),
  sesion('d', '2026-10-20', 'shoulder-press', 6, [34, 38, 42]),
  sesion('e', '2026-05-28', 'deadlift', 6, [110, 120, 130]),
  sesion('f', '2026-04-27', 'front-squat', 3, [75, 85, 95]),
];

export const sesionBorrada5x100 = sesion('z', '2026-07-01', 'back-squat', 5, [100], { borrado: true });
