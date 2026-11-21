import type { Datos } from './types';

function unirPorId<T extends { id: string; actualizado?: string }>(a: T[], b: T[]): T[] {
  const m = new Map<string, T>();
  for (const x of [...a, ...b]) {
    const prev = m.get(x.id);
    if (!prev || (x.actualizado ?? '') > (prev.actualizado ?? '')) m.set(x.id, x);
  }
  return [...m.values()];
}

/** Une dos copias de los datos. Mismo id → gana la de `actualizado` más reciente. Tombstones se conservan. */
export function fusionar(local: Datos, remoto: Datos): Datos {
  const porFecha = <T extends { fecha: string; id: string }>(xs: T[]) =>
    xs.sort((x, y) => (x.fecha === y.fecha ? x.id.localeCompare(y.id) : x.fecha.localeCompare(y.fecha)));
  return {
    version: 1,
    ejercicios: unirPorId(remoto.ejercicios, local.ejercicios).sort((x, y) => x.id.localeCompare(y.id)),
    sesiones: porFecha(unirPorId(remoto.sesiones, local.sesiones)),
    carreras: porFecha(unirPorId(remoto.carreras, local.carreras)),
  };
}
