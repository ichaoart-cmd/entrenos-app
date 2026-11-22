import { CATALOGO, iconoDe } from '../domain/catalogo';
/** Pictogramas propios (48×48, macizos). Vista frontal con barra horizontal; banca y fondos de lado.
 * El halo del disco usa --halo (color del fondo sobre el que se pinta). */
const L = (pts: string, w = 5) => `<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const H = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="4.6" fill="currentColor"/>`;
const D = (x: number, y: number, r = 6.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="var(--halo,#fff)" stroke-width="8"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="currentColor" stroke-width="3.2"/><circle cx="${x}" cy="${y}" r="1.8" fill="currentColor"/>`;
const B = (y: number, x1 = 8, x2 = 40) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><rect x="${x1 - 1}" y="${y - 6}" width="4.5" height="12" rx="1.6" fill="currentColor"/><rect x="${x2 - 3.5}" y="${y - 6}" width="4.5" height="12" rx="1.6" fill="currentColor"/>`;
const SUELO = `<line x1="6" y1="44.5" x2="42" y2="44.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".3"/>`;

export const ICONOS: Record<string, string> = {
  'correr': SUELO + H(29, 8) + L('28,14 22,26', 4) + L('27,16 33,21 37,17', 3.6) + L('26,17 19,20 15,16', 3.6) + L('22,26 30,32 28,43') + L('22,26 16,34 8,32'),
  'dominadas': `<line x1="6" y1="5" x2="42" y2="5" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/>` + L('15,5 18,19', 3.8) + L('33,5 30,19', 3.8) + H(24, 14) + L('18,19 30,19', 4) + L('24,19 24,31') + L('24,31 22,43') + L('24,31 26,43'),
  'remo': SUELO + H(10, 17) + L('14,19 30,21') + L('30,21 33,31 31,43') + L('31,43 36,43', 4) + L('19,20 20,27', 3.6) + D(20, 34, 5.5),
  'zancada': SUELO + B(13, 6, 42) + H(24, 7) + L('18,18 13,19 13,13', 3.6) + L('30,18 35,19 35,13', 3.6) + L('18,18 30,18', 4) + L('24,18 24,28') + L('24,28 32,32 33,43') + L('24,28 17,36 10,42'),
  'kettlebell': SUELO + H(24, 7) + L('18,13 30,13', 4) + L('24,13 24,24') + L('24,24 14,43') + L('24,24 34,43') + L('18,13 22,28', 3.4) + L('30,13 26,28', 3.4) + `<circle cx="24" cy="34" r="5.5" fill="var(--halo,#fff)"/><path d="M21 30.5 Q24 27 27 30.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><circle cx="24" cy="34.5" r="4.2" fill="currentColor"/>`,
  'jerk': SUELO + B(6, 6, 42) + L('19,20 13,6', 3.6) + L('29,20 35,6', 3.6) + H(24, 14) + L('19,20 29,20', 4) + L('24,20 24,30') + L('24,30 32,35 35,43') + L('24,30 17,36 11,43'),
  'back-squat': SUELO + B(14, 5, 43) + H(24, 8) + L('18,19 12,20 12,14', 3.6) + L('30,19 36,20 36,14', 3.6) + L('18,19 30,19', 4) + L('24,19 24,29') + L('24,29 15,33 16,43') + L('24,29 33,33 32,43'),
  'front-squat': SUELO + B(17, 7, 41) + H(24, 9) + L('18,20 15,23 19,17', 3.6) + L('30,20 33,23 29,17', 3.6) + L('18,20 30,20', 4) + L('24,20 24,29') + L('24,29 15,33 16,43') + L('24,29 33,33 32,43'),
  'press-banca': `<line x1="6" y1="34" x2="32" y2="34" stroke="currentColor" stroke-width="3.4" stroke-linecap="round"/><line x1="10" y1="34" x2="10" y2="43" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/><line x1="28" y1="34" x2="28" y2="43" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>` + H(8, 27) + L('13,29 27,29') + L('27,29 36,32 36,42') + L('18,28 19,19 18,12', 4) + D(18, 10, 7),
  'shoulder-press': SUELO + B(7) + L('19,21 13,15 13,7', 3.8) + L('29,21 35,15 35,7', 3.8) + H(24, 15) + L('19,21 29,21', 4) + L('24,21 24,32') + L('24,32 20,43') + L('24,32 28,43'),
  'deadlift': SUELO + H(24, 8) + L('18,14 30,14', 4) + L('24,14 24,27') + L('24,27 20,43') + L('24,27 28,43') + L('18,14 16,30', 3.6) + L('30,14 32,30', 3.6) + B(31, 6, 42),
  'push-press': SUELO + B(7) + L('19,21 13,15 13,7', 3.8) + L('29,21 35,15 35,7', 3.8) + H(24, 15) + L('19,21 29,21', 4) + L('24,21 24,30') + L('24,30 18,35 20,43') + L('24,30 30,35 28,43'),
  'snatch': SUELO + B(6, 5, 43) + L('19,21 9,6', 3.6) + L('29,21 39,6', 3.6) + H(24, 15) + L('19,21 29,21', 4) + L('24,21 24,30') + L('24,30 15,34 16,43') + L('24,30 33,34 32,43'),
  'power-snatch': SUELO + B(6, 5, 43) + L('19,21 9,6', 3.6) + L('29,21 39,6', 3.6) + H(24, 15) + L('19,21 29,21', 4) + L('24,21 24,32') + L('24,32 19,43') + L('24,32 29,43'),
  'clean': SUELO + B(17, 7, 41) + H(24, 9) + L('18,20 15,23 19,17', 3.6) + L('30,20 33,23 29,17', 3.6) + L('18,20 30,20', 4) + L('24,20 24,29') + L('24,29 15,33 16,43') + L('24,29 33,33 32,43'),
  'power-clean': SUELO + B(17, 7, 41) + H(24, 9) + L('18,20 15,23 19,17', 3.6) + L('30,20 33,23 29,17', 3.6) + L('18,20 30,20', 4) + L('24,20 24,32') + L('24,32 20,43') + L('24,32 28,43'),
  'dips': `<polyline points="8,44 8,24 15,24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".45"/><polyline points="40,44 40,24 33,24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".45"/>` + H(24, 8) + L('18,15 30,15', 4) + L('18,15 16,24', 4) + L('30,15 32,24', 4) + L('24,15 24,28') + L('24,28 21,36 25,41'),
  'push-ups': SUELO + H(38, 23) + L('34,27 10,36') + L('10,36 6,41', 4) + L('31,28 32,36 32,43', 4),
};

/** Ilustraciones a color (public/ilustraciones/*.webp). Lo que no está aquí usa el pictograma SVG. */
const ILUSTRACION: Record<string, string> = {
  // Sentadilla
  'back-squat': 'sentadilla', 'zercher-squat': 'sentadilla', 'goblet-squat': 'sentadilla',
  'front-squat': 'thruster', 'thruster': 'thruster', 'overhead-squat': 'overhead',
  // Peso muerto y bisagra
  'deadlift': 'peso-muerto', 'sumo-deadlift': 'peso-muerto', 'romanian-deadlift': 'peso-muerto', 'sdhp': 'peso-muerto',
  'good-morning': 'peso-muerto', 'hip-thrust': 'peso-muerto', 'farmer-carry': 'peso-muerto',
  // Empuje
  'press-banca': 'press-banca', 'shoulder-press': 'press-hombro', 'push-press': 'press-hombro', 'push-jerk': 'press-hombro',
  'db-press': 'press-hombro', 'split-jerk': 'split-jerk', 'dips': 'anillas', 'push-ups': 'burpee',
  // Tirón
  'dominadas': 'dominadas', 'remo-barra': 'remo-barra', 'remo-mancuerna': 'remo-barra',
  // Halterofilia
  'snatch': 'overhead', 'power-snatch': 'overhead', 'hang-snatch': 'overhead', 'hang-power-snatch': 'overhead',
  'snatch-balance': 'overhead', 'db-snatch': 'overhead',
  'clean': 'clean', 'power-clean': 'clean', 'hang-clean': 'clean', 'hang-power-clean': 'clean',
  'clean-and-jerk': 'split-jerk', 'db-clean-jerk': 'split-jerk',
  // Kettlebell y zancadas
  'kb-swing': 'kb-swing', 'walking-lunge': 'zancada', 'front-rack-lunge': 'zancada', 'bulgarian-split-squat': 'zancada',
  // Otros
  'metcon': 'wall-ball', 'correr': 'correr',
};
export const ilustracionDe = (id: string): string | null => ILUSTRACION[id] ?? null;

export function IconoEjercicio({ id, size = 40 }: { id: string; size?: number }) {
  const ilu = ilustracionDe(id);
  if (ilu) return <img class='ilustracion' src={`${import.meta.env.BASE_URL}ilustraciones/${ilu}.webp`} width={size} height={size} alt='' loading='lazy' decoding='async' />;
  return <svg width={size} height={size} viewBox='0 0 48 48' aria-hidden='true' dangerouslySetInnerHTML={{ __html: ICONOS[id] ?? ICONOS[iconoDe(id)] ?? ICONOS['back-squat'] }} />;
}

export const NOMBRE_CORTO: Record<string, string> = Object.fromEntries(CATALOGO.map((e) => [e.id, e.corto]));

const NAV: Record<string, string> = {
  inicio: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  historial: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3.5 2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  progreso: '<path d="M4 18 9.5 12l4 3.5L20 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  ajustes: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
};
export function IconoNav({ id }: { id: string }) {
  return <svg width='24' height='24' viewBox='0 0 24 24' aria-hidden='true' dangerouslySetInnerHTML={{ __html: NAV[id] }} />;
}
