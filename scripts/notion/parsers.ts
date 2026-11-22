import type { FormatoMetcon, Metcon } from '../../src/domain/types';

const MAPA_EJERCICIOS: Record<string, string> = {
  'back squat': 'back-squat', 'front squat': 'front-squat', 'press banca': 'press-banca',
  'shoulder press': 'shoulder-press', deadlift: 'deadlift', 'puss press': 'push-press', 'push press': 'push-press',
  snach: 'snatch', snatch: 'snatch', clean: 'clean', 'power clean': 'power-clean', dips: 'dips',
  'puss ups': 'push-ups', 'push ups': 'push-ups',
};

export function normalizarEjercicio(sel: string | null): string | null {
  if (!sel) return null;
  return MAPA_EJERCICIOS[sel.trim().toLowerCase()] ?? null;
}

export function extraerReps(titulo: string): number | null {
  const m = titulo.match(/(\d+(?:[.,]\d+)?)\s*(?:kg)?\.?\s*[xX]\s*(\d+(?:[.,]\d+)?)/);
  if (!m) return null;
  const nums = [m[1], m[2]].map((x) => Number(x.replace(',', '.')));
  const reps = nums.filter((n) => Number.isInteger(n) && n >= 1 && n <= 20);
  return reps.length ? Math.min(...reps) : null;
}

export function extraerVariante(titulo: string): string | undefined {
  if (/\bbt[nw]\b/i.test(titulo)) return 'btn';
  if (/close|cerrado/i.test(titulo)) return 'close grip';
  if (/\bMG\b|medio|mi[snd]+ grip/i.test(titulo)) return 'agarre medio';
  if (/\bh\.?\s?l\.?(?![a-z])/i.test(titulo)) return 'barra alta';
  return undefined;
}

export function normalizarTempo(t: string | null): string | undefined {
  if (!t) return undefined;
  const s = t.toLowerCase();
  const m = s.match(/(?<!\d)([2-6])(?!\d)|\b(dos|tres|cuatro|cinco|seis)\b/);
  if (!m) return undefined;
  const palabras: Record<string, string> = { dos: '2', tres: '3', cuatro: '4', cinco: '5', seis: '6' };
  const seg = `${m[1] ?? palabras[m[2]]}s`;
  return /pausa/.test(s) ? `${seg}+pausa` : seg;
}

function formato(texto: string): FormatoMetcon {
  const s = texto.toLowerCase();
  if (/\bon\b.*\boff\b|i go you go/.test(s)) return 'Intervalos';
  if (/emom/.test(s)) return 'EMOM';
  if (/amrap/.test(s)) return 'AMRAP';
  if (/for time|\b\d+\s*,\s*\d+\s*,\s*\d+\b/.test(s)) return 'ForTime';
  return 'Otro';
}

export function parsearMetcon(texto: string): Metcon | undefined {
  const lineas = texto.split('\n');
  if (lineas.length && /^\s*(metco[mn]|performa\w*)\s*$/i.test(lineas[0])) lineas.shift();
  const descripcion = lineas.join('\n').trim();
  if (!descripcion) return undefined;

  const m: Metcon = { formato: formato(descripcion), descripcion };

  const duraciones = [...descripcion.matchAll(/(\d+)\s*(?:min|’(?!’)|'(?!'))/gi)].map((x) => Number(x[1]));
  if (duraciones.length) m.duracionMin = Math.max(...duraciones);

  const paren = [...descripcion.matchAll(/\(([^)]*)\)/g)].map((x) => x[1].trim());
  const rr = paren.find((p) => /^\d+\s*\+\s*\d+$/.test(p));
  const tiempo = paren.find((p) => /^\d+:\d\d$/.test(p));
  const numeros = paren.filter((p) => /^\d+$/.test(p));
  if (rr) m.resultado = { tipo: 'rondas+reps', valor: rr.replace(/\s/g, '') };
  else if (tiempo) m.resultado = { tipo: 'tiempo', valor: tiempo };
  else if (numeros.length > 1) m.resultado = { tipo: 'bloques', valor: numeros.join('/') };
  else if (numeros.length === 1) m.resultado = { tipo: 'reps', valor: numeros[0] };
  return m;
}

/** Corrige el ejercicio cuando el título contradice el desplegable de Notion (erratas detectadas en el histórico). */
export function corregirEjercicio(id: string, titulo: string): string {
  if (/domin/i.test(titulo)) return 'dominadas';
  if (id === 'snatch' && /power/i.test(titulo)) return 'power-snatch';
  if (id === 'clean' && /power/i.test(titulo)) return 'power-clean';
  return id;
}

/** Reps por serie escritas en el título ("9,7,5,7,9"); solo si hay tantas como series. */
export function extraerRepsSeries(titulo: string, nSeries: number): number[] | undefined {
  const m = titulo.match(/\b\d{1,2}(?:\s*,\s*\d{1,2}){2,}\b/);
  if (!m) return undefined;
  const reps = m[0].split(',').map((x) => Number(x.trim()));
  return reps.length === nSeries ? reps : undefined;
}
