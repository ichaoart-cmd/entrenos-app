import type { Carrera, Sesion } from '../domain/types';
import { formatearRitmo, formatearTiempo } from '../domain/carrera';
import type { ResultadoSync } from '../store/sync';
import type { EstadoSync } from '../store/estado';
import { EJERCICIOS_BASE } from '../store/local';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export function fechaLarga(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number);
  return `${d} ${MESES[m - 1]} ${a}`;
}

export function nombreEjercicio(id: string): string {
  return EJERCICIOS_BASE.find((e) => e.id === id)?.nombre ?? id;
}

const kg = (n: number) => String(n).replace('.', ',');

export function resumenFuerza(s: Sesion): string {
  return s.fuerza
    .map((f) => `${nombreEjercicio(f.ejercicio)}${f.variante && f.variante !== 'normal' ? ` (${f.variante})` : ''} ${f.reps ?? '?'}×${f.series.length ? kg(Math.max(...f.series)) : '?'}`)
    .join(' · ');
}

const FORMATO: Record<string, string> = { ForTime: 'For Time' };

export function resumenMetcon(s: Sesion): string {
  if (!s.metcon) return '';
  const r = s.metcon.resultado?.valor;
  return `${FORMATO[s.metcon.formato] ?? s.metcon.formato}${r ? ` ${r}` : ''}`;
}

export function textoSync(estadoSync: EstadoSync, r: ResultadoSync | null): string {
  if (r && !r.ok) {
    if (r.motivo === 'token') return 'Sin subir: revisa el token en Ajustes';
    if (r.motivo === 'limite') return 'GitHub nos ha puesto en pausa un rato; se sube solo luego';
    if (r.motivo === 'sin-token') return 'Guardado en este móvil ✓';
    return estadoSync === 'ok' ? 'Sin cobertura, pero todo está a salvo' : 'Se sube en cuanto haya cobertura';
  }
  return estadoSync === 'ok' ? 'A salvo en GitHub ✓' : 'Subiendo…';
}

const TIPO_CARRERA: Record<string, string> = { rodaje: 'Rodaje', series: 'Series', 'tirada larga': 'Tirada larga', 'competición': 'Competición' };

/** «Rodaje 8 km · 42:10 · 5:16 /km» */
export function resumenCarrera(c: Carrera): string {
  return `${TIPO_CARRERA[c.tipo ?? ''] ?? 'Carrera'} ${kg(c.distanciaKm)} km · ${formatearTiempo(c.tiempoSeg)} · ${formatearRitmo(c.tiempoSeg / c.distanciaKm)} /km${c.fcMedia ? ` · ${c.fcMedia} ppm` : ''}`;
}
