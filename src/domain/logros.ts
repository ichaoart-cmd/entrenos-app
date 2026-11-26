import type { Datos, Sesion } from './types';
import { detectarPR } from './records';
import { e1rm, esFiable } from './rm';
import { repsDeTop } from './reps';
import { pesoEn } from './peso';
import { BENCHMARKS, historialBenchmark } from './benchmarks';

export type Nivel = 'bronce' | 'plata' | 'oro';
export type Familia = 'Constancia' | 'Fuerza' | 'Metcon' | 'Carrera' | 'Báscula';
export interface Logro {
  id: string; nombre: string; descripcion: string; familia: Familia; nivel: Nivel; icono: string;
  /** Día en que se consiguió; null si aún no. */
  fecha: string | null;
  progreso: { actual: number; meta: number };
}

type Def = Omit<Logro, 'fecha' | 'progreso'> & { calc: (c: Ctx) => { fecha: string | null; actual: number; meta: number } };

interface Ctx { sesiones: Sesion[]; datos: Datos; minSemana: number; fechasEntreno: string[] }

/** Fecha en la que una lista ordenada de fechas llega a `n` elementos. */
function enesima(fechas: string[], n: number) {
  return { fecha: fechas.length >= n ? fechas[n - 1] : null, actual: Math.min(fechas.length, n), meta: n };
}

const lunes = (f: string) => { const d = new Date(f + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7)); return d.toISOString().slice(0, 10); };
const masDias = (f: string, n: number) => { const d = new Date(f + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

/** Mejor racha de semanas seguidas con `min` entrenos, y el día en que se llegó a `n` semanas. */
function racha(fechas: string[], min: number, n: number) {
  const porSemana = new Map<string, string[]>();
  for (const f of fechas) { const l = lunes(f); porSemana.set(l, [...(porSemana.get(l) ?? []), f]); }
  const semanas = [...porSemana.keys()].sort();
  let mejor = 0, actual = 0, previa = '', fecha: string | null = null;
  for (const l of semanas) {
    const dias = porSemana.get(l)!.sort();
    if (dias.length < min) { actual = 0; previa = l; continue; }
    actual = previa && masDias(previa, 7) === l && actual > 0 ? actual + 1 : 1;
    previa = l;
    if (actual > mejor) mejor = actual;
    if (actual >= n && !fecha) fecha = dias[min - 1];
  }
  return { fecha, actual: Math.min(mejor, n), meta: n };
}

/** Primer día en que el 1RM estimado del ejercicio llegó a `veces` × el peso corporal de ese día. */
function relativa(id: string, veces: number) {
  return ({ sesiones, datos }: Ctx) => {
    const pesos = datos.pesos ?? [];
    let mejor = 0, mejorRel = 0;
    for (const s of sesiones) {
      for (const f of s.fuerza) {
        const reps = repsDeTop(f);
        if (f.ejercicio !== id || reps == null || !esFiable(reps) || !f.series.length) continue;
        mejor = Math.max(mejor, e1rm(Math.max(...f.series), reps));
      }
      const peso = pesoEn(pesos, s.fecha);
      if (!peso || !mejor) continue;
      mejorRel = Math.max(mejorRel, mejor / peso);
      if (mejorRel >= veces) return { fecha: s.fecha, actual: veces, meta: veces };
    }
    return { fecha: null, actual: Math.round(mejorRel * 100) / 100, meta: veces };
  };
}

/** Primer día con una serie de `kg` o más (cualquier ejercicio de fuerza). */
function serieDe(kg: number) {
  return ({ sesiones }: Ctx) => {
    let max = 0;
    for (const s of sesiones) for (const f of s.fuerza) {
      const top = f.series.length ? Math.max(...f.series) : 0;
      max = Math.max(max, top);
      if (top >= kg) return { fecha: s.fecha, actual: kg, meta: kg };
    }
    return { fecha: null, actual: max, meta: kg };
  };
}

/** Fechas de cada récord personal, en orden. */
function fechasRecord(sesiones: Sesion[]): string[] {
  const res: string[] = [];
  sesiones.forEach((s, i) => {
    const antes = sesiones.slice(0, i);
    for (const f of s.fuerza) {
      if (!antes.some((p) => p.fuerza.some((x) => x.ejercicio === f.ejercicio))) continue; // la primera vez no cuenta
      if (detectarPR(f, s.fecha, antes)) res.push(s.fecha);
    }
  });
  return res;
}

/** Fechas en que se hizo por primera vez cada WOD de referencia. */
function fechasBenchmarks(sesiones: Sesion[]): string[] {
  return BENCHMARKS.map((b) => historialBenchmark(sesiones, b.id).map((m) => m.fecha).sort()[0]).filter(Boolean).sort();
}

function carrera(km: number) {
  return ({ datos }: Ctx) => {
    const cs = datos.carreras.filter((c) => !c.borrado).sort((a, b) => a.fecha.localeCompare(b.fecha));
    const c = cs.find((x) => x.distanciaKm >= km - 0.05);
    const mejor = Math.max(0, ...cs.map((x) => x.distanciaKm));
    return { fecha: c?.fecha ?? null, actual: c ? km : Math.round(mejor * 10) / 10, meta: km };
  };
}

function kmTotales(km: number) {
  return ({ datos }: Ctx) => {
    let acc = 0;
    for (const c of datos.carreras.filter((x) => !x.borrado).sort((a, b) => a.fecha.localeCompare(b.fecha))) {
      acc += c.distanciaKm;
      if (acc >= km) return { fecha: c.fecha, actual: km, meta: km };
    }
    return { fecha: null, actual: Math.round(acc), meta: km };
  };
}

const DEFS: Def[] = [
  { id: 'primera', nombre: 'Insert coin', descripcion: 'Tu primer entreno registrado', familia: 'Constancia', nivel: 'bronce', icono: 'back-squat', calc: (c) => enesima(c.fechasEntreno, 1) },
  { id: 'entrenos-50', nombre: 'Habitual del box', descripcion: '50 días entrenando', familia: 'Constancia', nivel: 'bronce', icono: 'kettlebell', calc: (c) => enesima(c.fechasEntreno, 50) },
  { id: 'entrenos-100', nombre: 'Centurión', descripcion: '100 días entrenando', familia: 'Constancia', nivel: 'plata', icono: 'kettlebell', calc: (c) => enesima(c.fechasEntreno, 100) },
  { id: 'entrenos-250', nombre: 'Leyenda del box', descripcion: '250 días entrenando', familia: 'Constancia', nivel: 'oro', icono: 'kettlebell', calc: (c) => enesima(c.fechasEntreno, 250) },
  { id: 'racha-4', nombre: 'Combo x4', descripcion: '4 semanas seguidas llegando a tu mínimo de días', familia: 'Constancia', nivel: 'bronce', icono: 'dominadas', calc: (c) => racha(c.fechasEntreno, c.minSemana, 4) },
  { id: 'racha-12', nombre: 'Combo x12', descripcion: '12 semanas seguidas llegando a tu mínimo de días', familia: 'Constancia', nivel: 'plata', icono: 'dominadas', calc: (c) => racha(c.fechasEntreno, c.minSemana, 12) },
  { id: 'racha-26', nombre: 'Medio año sin fallar', descripcion: '26 semanas seguidas llegando a tu mínimo de días', familia: 'Constancia', nivel: 'oro', icono: 'dominadas', calc: (c) => racha(c.fechasEntreno, c.minSemana, 26) },
  { id: 'club-100', nombre: 'Club de los 100', descripcion: 'Una serie de 100 kg o más', familia: 'Fuerza', nivel: 'plata', icono: 'deadlift', calc: serieDe(100) },
  { id: 'records-10', nombre: 'Rompe-récords', descripcion: '10 récords personales', familia: 'Fuerza', nivel: 'bronce', icono: 'back-squat', calc: (c) => enesima(fechasRecord(c.sesiones), 10) },
  { id: 'records-50', nombre: 'Máquina de PRs', descripcion: '50 récords personales', familia: 'Fuerza', nivel: 'oro', icono: 'back-squat', calc: (c) => enesima(fechasRecord(c.sesiones), 50) },
  { id: 'banca-1', nombre: 'Tu peso en banca', descripcion: 'Press banca: 1RM estimado igual a tu peso', familia: 'Fuerza', nivel: 'bronce', icono: 'press-banca', calc: relativa('press-banca', 1) },
  { id: 'squat-1-5', nombre: 'Sentadilla 1,5×', descripcion: 'Back squat: 1RM estimado de 1,5 veces tu peso', familia: 'Fuerza', nivel: 'plata', icono: 'back-squat', calc: relativa('back-squat', 1.5) },
  { id: 'squat-2', nombre: 'Doble de ti', descripcion: 'Back squat: 1RM estimado del doble de tu peso', familia: 'Fuerza', nivel: 'oro', icono: 'back-squat', calc: relativa('back-squat', 2) },
  { id: 'muerto-2', nombre: 'Arrancar del suelo 2×', descripcion: 'Peso muerto: 1RM estimado del doble de tu peso', familia: 'Fuerza', nivel: 'oro', icono: 'deadlift', calc: relativa('deadlift', 2) },
  { id: 'press-0-75', nombre: 'Hombros de acero', descripcion: 'Shoulder press: 1RM estimado de 0,75 veces tu peso', familia: 'Fuerza', nivel: 'plata', icono: 'shoulder-press', calc: relativa('shoulder-press', 0.75) },
  { id: 'wod-1', nombre: 'Primera chica', descripcion: 'Tu primer WOD de referencia (Fran, Cindy…)', familia: 'Metcon', nivel: 'bronce', icono: 'metcon', calc: (c) => enesima(fechasBenchmarks(c.sesiones), 1) },
  { id: 'wod-5', nombre: 'Coleccionista', descripcion: '5 WODs de referencia distintos', familia: 'Metcon', nivel: 'plata', icono: 'metcon', calc: (c) => enesima(fechasBenchmarks(c.sesiones), 5) },
  { id: 'murph', nombre: 'Murph superado', descripcion: 'Has hecho Murph. Respeto.', familia: 'Metcon', nivel: 'oro', icono: 'metcon', calc: (c) => enesima(historialBenchmark(c.sesiones, 'murph').map((m) => m.fecha).sort(), 1) },
  { id: 'run-5', nombre: 'Primer 5K', descripcion: 'Una carrera de 5 km o más', familia: 'Carrera', nivel: 'bronce', icono: 'correr', calc: carrera(5) },
  { id: 'run-10', nombre: 'Diez de diez', descripcion: 'Una carrera de 10 km o más', familia: 'Carrera', nivel: 'plata', icono: 'correr', calc: carrera(10) },
  { id: 'run-21', nombre: 'Media maratón', descripcion: 'Una carrera de 21,1 km o más', familia: 'Carrera', nivel: 'oro', icono: 'correr', calc: carrera(21.1) },
  { id: 'km-100', nombre: '100 km en las piernas', descripcion: '100 km corridos en total', familia: 'Carrera', nivel: 'plata', icono: 'correr', calc: kmTotales(100) },
  { id: 'bascula-10', nombre: 'Báscula fiel', descripcion: '10 pesadas apuntadas', familia: 'Báscula', nivel: 'bronce', icono: 'bascula',
    calc: (c) => enesima((c.datos.pesos ?? []).filter((p) => !p.borrado).map((p) => p.fecha).sort(), 10) },
];

export function calcularLogros(datos: Datos, minSemana: number): Logro[] {
  const sesiones = datos.sesiones.filter((s) => !s.borrado).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const dias = new Set([...sesiones.map((s) => s.fecha), ...datos.carreras.filter((c) => !c.borrado).map((c) => c.fecha)]);
  const ctx: Ctx = { sesiones, datos, minSemana, fechasEntreno: [...dias].sort() };
  return DEFS.map(({ calc, ...d }) => { const r = calc(ctx); return { ...d, fecha: r.fecha, progreso: { actual: r.actual, meta: r.meta } }; });
}
