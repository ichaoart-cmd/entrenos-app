/** Pictogramas propios (líneas simples) por patrón de movimiento, y un color por ejercicio. */
type Patron = 'sentadilla' | 'banca' | 'press' | 'muerto' | 'olimpico' | 'fondos';

const PATRON: Record<string, Patron> = {
  'back-squat': 'sentadilla', 'front-squat': 'sentadilla', 'press-banca': 'banca', 'push-ups': 'banca',
  'shoulder-press': 'press', 'push-press': 'press', deadlift: 'muerto',
  snatch: 'olimpico', 'power-snatch': 'olimpico', clean: 'olimpico', 'power-clean': 'olimpico', dips: 'fondos',
};

export const COLOR: Record<string, string> = {
  'back-squat': '#d7263d', 'front-squat': '#f2b705', 'press-banca': '#1f5fbf', 'shoulder-press': '#2e9e5b',
  deadlift: '#15171a', 'push-press': '#5b8def', snatch: '#7a4fd0', 'power-snatch': '#7a4fd0',
  clean: '#c2417a', 'power-clean': '#c2417a', dips: '#8a8f98', 'push-ups': '#8a8f98',
};
/** Colores claros sobre los que el texto va en tinta, no en blanco. */
export const COLOR_CLARO = new Set(['#f2b705', '#8a8f98']);
export const colorDe = (id: string) => COLOR[id] ?? '#98989d';
export const COLOR_METCON = '#8a8f98';

const trazo = { fill: 'none', stroke: 'currentColor', strokeWidth: 2.4, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function dibujo(p: Patron) {
  switch (p) {
    case 'sentadilla': return <>
      <line x1='6' y1='12' x2='34' y2='12' {...trazo} /><rect x='4' y='8' width='4' height='8' rx='1' fill='currentColor' /><rect x='32' y='8' width='4' height='8' rx='1' fill='currentColor' />
      <circle cx='20' cy='7' r='3' fill='currentColor' /><path d='M20 12 L19 21 L26 25 L22 34 M19 21 L13 26 L16 34' {...trazo} /></>;
    case 'banca': return <>
      <line x1='5' y1='30' x2='35' y2='30' {...trazo} /><line x1='12' y1='30' x2='12' y2='35' {...trazo} /><line x1='28' y1='30' x2='28' y2='35' {...trazo} />
      <circle cx='9' cy='25' r='3' fill='currentColor' /><path d='M12 26 L30 26 M18 26 L18 14 M24 26 L24 14' {...trazo} />
      <line x1='8' y1='12' x2='34' y2='12' {...trazo} /><rect x='6' y='8' width='4' height='8' rx='1' fill='currentColor' /><rect x='32' y='8' width='4' height='8' rx='1' fill='currentColor' /></>;
    case 'press': return <>
      <line x1='6' y1='5' x2='34' y2='5' {...trazo} /><rect x='4' y='1' width='4' height='8' rx='1' fill='currentColor' /><rect x='32' y='1' width='4' height='8' rx='1' fill='currentColor' />
      <path d='M13 5 L15 14 L20 17 L25 14 L27 5' {...trazo} /><circle cx='20' cy='13' r='3' fill='currentColor' /><path d='M20 17 L20 27 L16 36 M20 27 L24 36' {...trazo} /></>;
    case 'muerto': return <>
      <circle cx='14' cy='9' r='3' fill='currentColor' /><path d='M15 13 L23 21 L22 36 M23 21 L18 28 L19 36 M17 15 L19 30' {...trazo} />
      <line x1='6' y1='31' x2='34' y2='31' {...trazo} /><rect x='4' y='26' width='4' height='10' rx='1' fill='currentColor' /><rect x='32' y='26' width='4' height='10' rx='1' fill='currentColor' /></>;
    case 'olimpico': return <>
      <line x1='4' y1='5' x2='36' y2='5' {...trazo} /><rect x='2' y='1' width='4' height='8' rx='1' fill='currentColor' /><rect x='34' y='1' width='4' height='8' rx='1' fill='currentColor' />
      <path d='M10 5 L16 15 L24 15 L30 5' {...trazo} /><circle cx='20' cy='12' r='3' fill='currentColor' /><path d='M20 15 L20 24 L13 28 L15 36 M20 24 L27 28 L25 36' {...trazo} /></>;
    case 'fondos': return <>
      <path d='M6 36 L6 20 L12 20 M34 36 L34 20 L28 20' {...trazo} /><circle cx='20' cy='7' r='3' fill='currentColor' />
      <path d='M20 11 L20 24 M12 20 L14 12 L20 12 L26 12 L28 20 M20 24 L17 32 M20 24 L23 32' {...trazo} /></>;
  }
}

export function IconoEjercicio({ id, size = 40 }: { id: string; size?: number }) {
  const p = PATRON[id] ?? 'sentadilla';
  return <svg width={size} height={size} viewBox='0 0 40 40' aria-hidden='true' style={{ color: colorDe(id) }}>{dibujo(p)}</svg>;
}
