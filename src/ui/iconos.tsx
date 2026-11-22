/** Pictogramas propios (48×48, macizos). Vista frontal con barra horizontal; banca y fondos de lado.
 * El halo del disco usa --halo (color del fondo sobre el que se pinta). */
const L = (pts: string, w = 5) => `<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const H = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="4.6" fill="currentColor"/>`;
const D = (x: number, y: number, r = 6.5) => `<circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="var(--halo,#fff)" stroke-width="8"/><circle cx="${x}" cy="${y}" r="${r}" fill="none" stroke="currentColor" stroke-width="3.2"/><circle cx="${x}" cy="${y}" r="1.8" fill="currentColor"/>`;
const B = (y: number, x1 = 8, x2 = 40) => `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><rect x="${x1 - 1}" y="${y - 6}" width="4.5" height="12" rx="1.6" fill="currentColor"/><rect x="${x2 - 3.5}" y="${y - 6}" width="4.5" height="12" rx="1.6" fill="currentColor"/>`;
const SUELO = `<line x1="6" y1="44.5" x2="42" y2="44.5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".3"/>`;

export const ICONOS: Record<string, string> = {
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
  'dips': `<polyline points="8,44 8,24 15,24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".45"/><polyline points="40,44 40,24 33,24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" opacity=".45"/>` + H(24, 8) + L('18,15 30,15', 4) + L('18,15 16,24', 4) + L('30,15 32,24', 4) + L('24,15 24,28') + L('24,28 21,36 25,41') + L('24,28 27,36 23,41', 0.1),
  'push-ups': SUELO + H(38, 23) + L('34,27 10,36') + L('10,36 6,41', 4) + L('31,28 32,36 32,43', 4),
};

export function IconoEjercicio({ id, size = 40 }: { id: string; size?: number }) {
  return <svg width={size} height={size} viewBox='0 0 48 48' aria-hidden='true' dangerouslySetInnerHTML={{ __html: ICONOS[id] ?? ICONOS['back-squat'] }} />;
}

export const NOMBRE_CORTO: Record<string, string> = {
  'back-squat': 'Back Sq.', 'front-squat': 'Front Sq.', 'press-banca': 'Banca', 'shoulder-press': 'Shoulder',
  deadlift: 'P. muerto', 'push-press': 'Push Press', snatch: 'Snatch', 'power-snatch': 'P. Snatch',
  clean: 'Clean', 'power-clean': 'P. Clean', dips: 'Fondos', 'push-ups': 'Flexiones',
};

const NAV: Record<string, string> = {
  inicio: '<path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/>',
  historial: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 7v5l3.5 2.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
  progreso: '<path d="M4 18 9.5 12l4 3.5L20 7" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
  ajustes: '<circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
};
export function IconoNav({ id }: { id: string }) {
  return <svg width='24' height='24' viewBox='0 0 24 24' aria-hidden='true' dangerouslySetInnerHTML={{ __html: NAV[id] }} />;
}
