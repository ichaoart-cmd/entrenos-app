import type { Sesion } from '../domain/types';
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
    if (r.motivo === 'token') return 'Sin sincronizar: revisa el token';
    if (r.motivo === 'sin-token') return 'Sin sincronizar: añade tu token en Ajustes';
    return estadoSync === 'ok' ? 'Sin conexión · todo está subido' : 'Pendiente de subir (sin conexión)';
  }
  return estadoSync === 'ok' ? 'Sincronizado ✓' : 'Pendiente de subir';
}
