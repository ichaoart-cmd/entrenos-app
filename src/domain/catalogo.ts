/** Catálogo de ejercicios de fuerza habituales en CrossFit. Los ids existentes no cambian (compatibles con el histórico). */
export interface EntradaCatalogo {
  id: string; nombre: string; corto: string; grupo: Grupo; icono: string; alias?: string[]; variantes?: string[];
}
export type Grupo = 'Sentadilla' | 'Peso muerto y bisagra' | 'Empuje' | 'Tirón' | 'Halterofilia' | 'Kettlebell y mancuerna' | 'Zancadas';
export const GRUPOS: Grupo[] = ['Sentadilla', 'Peso muerto y bisagra', 'Empuje', 'Tirón', 'Halterofilia', 'Kettlebell y mancuerna', 'Zancadas'];

const TEXTO_VARIANTE: Record<string, string> = {
  normal: 'Normal', btn: 'Tras nuca', 'close grip': 'Agarre cerrado', 'agarre medio': 'Agarre medio', 'barra alta': 'Barra alta',
  'barra baja': 'Barra baja', box: 'Al cajón', inclinado: 'Inclinado', sentado: 'Sentado', deficit: 'Déficit',
  prono: 'Prono', supino: 'Supino', pendlay: 'Pendlay', 'desde bloques': 'Desde bloques',
};

export const CATALOGO: EntradaCatalogo[] = [
  // Sentadilla
  { id: 'back-squat', nombre: 'Back Squat', corto: 'Back Sq.', grupo: 'Sentadilla', icono: 'back-squat', alias: ['sentadilla trasera', 'sentadilla'], variantes: ['barra alta', 'barra baja', 'box'] },
  { id: 'front-squat', nombre: 'Front Squat', corto: 'Front Sq.', grupo: 'Sentadilla', icono: 'front-squat', alias: ['sentadilla frontal'] },
  { id: 'overhead-squat', nombre: 'Overhead Squat', corto: 'OHS', grupo: 'Sentadilla', icono: 'snatch', alias: ['ohs', 'sentadilla overhead'] },
  { id: 'goblet-squat', nombre: 'Goblet Squat', corto: 'Goblet', grupo: 'Sentadilla', icono: 'kettlebell', alias: ['sentadilla goblet'] },
  { id: 'zercher-squat', nombre: 'Zercher Squat', corto: 'Zercher', grupo: 'Sentadilla', icono: 'front-squat' },
  // Peso muerto y bisagra
  { id: 'deadlift', nombre: 'Peso muerto', corto: 'P. muerto', grupo: 'Peso muerto y bisagra', icono: 'deadlift', alias: ['deadlift', 'convencional'], variantes: ['deficit'] },
  { id: 'sumo-deadlift', nombre: 'Peso muerto sumo', corto: 'Sumo', grupo: 'Peso muerto y bisagra', icono: 'deadlift', alias: ['sumo deadlift'] },
  { id: 'romanian-deadlift', nombre: 'Peso muerto rumano', corto: 'Rumano', grupo: 'Peso muerto y bisagra', icono: 'deadlift', alias: ['rdl', 'romanian deadlift'] },
  { id: 'sdhp', nombre: 'Sumo Deadlift High Pull', corto: 'SDHP', grupo: 'Peso muerto y bisagra', icono: 'deadlift', alias: ['high pull'] },
  { id: 'good-morning', nombre: 'Good Morning', corto: 'Good Morn.', grupo: 'Peso muerto y bisagra', icono: 'back-squat', alias: ['buenos dias'] },
  { id: 'hip-thrust', nombre: 'Hip Thrust', corto: 'Hip Thrust', grupo: 'Peso muerto y bisagra', icono: 'press-banca', alias: ['empuje de cadera'] },
  // Empuje
  { id: 'press-banca', nombre: 'Press Banca', corto: 'Banca', grupo: 'Empuje', icono: 'press-banca', alias: ['bench press', 'press de banca'], variantes: ['close grip', 'agarre medio', 'inclinado'] },
  { id: 'shoulder-press', nombre: 'Shoulder Press', corto: 'Shoulder', grupo: 'Empuje', icono: 'shoulder-press', alias: ['press militar', 'strict press', 'press estricto', 'press hombro'], variantes: ['btn', 'sentado'] },
  { id: 'push-press', nombre: 'Push Press', corto: 'Push Press', grupo: 'Empuje', icono: 'push-press', alias: ['press con impulso'], variantes: ['btn'] },
  { id: 'push-jerk', nombre: 'Push Jerk', corto: 'Push Jerk', grupo: 'Empuje', icono: 'push-press', alias: ['jerk'] },
  { id: 'split-jerk', nombre: 'Split Jerk', corto: 'Split Jerk', grupo: 'Empuje', icono: 'jerk', alias: ['jerk', 'envion'], variantes: ['btn', 'desde bloques'] },
  { id: 'thruster', nombre: 'Thruster', corto: 'Thruster', grupo: 'Empuje', icono: 'push-press', alias: ['trhuster'] },
  { id: 'db-press', nombre: 'Press con mancuernas', corto: 'Press manc.', grupo: 'Empuje', icono: 'shoulder-press', alias: ['dumbbell press'], variantes: ['sentado', 'inclinado'] },
  { id: 'dips', nombre: 'Fondos con lastre', corto: 'Fondos', grupo: 'Empuje', icono: 'dips', alias: ['dips', 'fondos'] },
  { id: 'push-ups', nombre: 'Flexiones con lastre', corto: 'Flexiones', grupo: 'Empuje', icono: 'push-ups', alias: ['push ups', 'flexiones'] },
  // Tirón
  { id: 'dominadas', nombre: 'Dominadas con lastre', corto: 'Dominadas', grupo: 'Tirón', icono: 'dominadas', alias: ['pull up', 'chin up', 'dominada'], variantes: ['prono', 'supino'] },
  { id: 'remo-barra', nombre: 'Remo con barra', corto: 'Remo barra', grupo: 'Tirón', icono: 'remo', alias: ['bent over row', 'row'], variantes: ['pendlay'] },
  { id: 'remo-mancuerna', nombre: 'Remo con mancuerna', corto: 'Remo manc.', grupo: 'Tirón', icono: 'remo', alias: ['dumbbell row'] },
  // Halterofilia
  { id: 'snatch', nombre: 'Snatch', corto: 'Snatch', grupo: 'Halterofilia', icono: 'snatch', alias: ['squat snatch', 'arrancada'] },
  { id: 'power-snatch', nombre: 'Power Snatch', corto: 'P. Snatch', grupo: 'Halterofilia', icono: 'power-snatch', alias: ['arrancada de fuerza'] },
  { id: 'hang-snatch', nombre: 'Hang Snatch', corto: 'Hang Sn.', grupo: 'Halterofilia', icono: 'snatch', alias: ['arrancada colgada'] },
  { id: 'hang-power-snatch', nombre: 'Hang Power Snatch', corto: 'HPS', grupo: 'Halterofilia', icono: 'power-snatch', alias: ['hps'] },
  { id: 'snatch-balance', nombre: 'Snatch Balance', corto: 'Sn. Balance', grupo: 'Halterofilia', icono: 'snatch' },
  { id: 'clean', nombre: 'Squat Clean', corto: 'Clean', grupo: 'Halterofilia', icono: 'clean', alias: ['clean', 'cargada'] },
  { id: 'power-clean', nombre: 'Power Clean', corto: 'P. Clean', grupo: 'Halterofilia', icono: 'power-clean', alias: ['cargada de fuerza'] },
  { id: 'hang-clean', nombre: 'Hang Clean', corto: 'Hang Cl.', grupo: 'Halterofilia', icono: 'clean', alias: ['cargada colgada'] },
  { id: 'hang-power-clean', nombre: 'Hang Power Clean', corto: 'HPC', grupo: 'Halterofilia', icono: 'power-clean', alias: ['hpc'] },
  { id: 'clean-and-jerk', nombre: 'Clean & Jerk', corto: 'C&J', grupo: 'Halterofilia', icono: 'jerk', alias: ['clean and jerk', 'dos tiempos', 'envion'] },
  // Kettlebell y mancuerna
  { id: 'kb-swing', nombre: 'Kettlebell Swing', corto: 'KB Swing', grupo: 'Kettlebell y mancuerna', icono: 'kettlebell', alias: ['swing', 'kettlebell'] },
  { id: 'db-snatch', nombre: 'Dumbbell Snatch', corto: 'DB Snatch', grupo: 'Kettlebell y mancuerna', icono: 'power-snatch', alias: ['snatch mancuerna'] },
  { id: 'db-clean-jerk', nombre: 'Dumbbell Clean & Jerk', corto: 'DB C&J', grupo: 'Kettlebell y mancuerna', icono: 'jerk', alias: ['mancuerna'] },
  { id: 'farmer-carry', nombre: 'Farmer Carry', corto: 'Farmer', grupo: 'Kettlebell y mancuerna', icono: 'deadlift', alias: ['paseo del granjero'] },
  // Zancadas
  { id: 'walking-lunge', nombre: 'Zancadas', corto: 'Zancadas', grupo: 'Zancadas', icono: 'zancada', alias: ['lunge', 'walking lunge'] },
  { id: 'front-rack-lunge', nombre: 'Zancadas front rack', corto: 'Zanc. rack', grupo: 'Zancadas', icono: 'zancada', alias: ['front rack lunge'] },
  { id: 'bulgarian-split-squat', nombre: 'Sentadilla búlgara', corto: 'Búlgara', grupo: 'Zancadas', icono: 'zancada', alias: ['bulgarian split squat'] },
];

const POR_ID = new Map(CATALOGO.map((e) => [e.id, e]));
export const entrada = (id: string) => POR_ID.get(id);
export const iconoDe = (id: string) => POR_ID.get(id)?.icono ?? 'back-squat';

const normal = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

export function buscarEjercicios(texto: string): EntradaCatalogo[] {
  const q = normal(texto);
  if (!q) return CATALOGO;
  return CATALOGO.filter((e) => [e.nombre, e.corto, ...(e.alias ?? [])].some((t) => normal(t).includes(q)));
}

/** Variantes que tienen sentido para el ejercicio; incluye la guardada aunque ya no esté en la lista. */
export function variantesDe(id: string, actual?: string): { valor: string; texto: string }[] {
  const valores = ['normal', ...(POR_ID.get(id)?.variantes ?? [])];
  if (actual && !valores.includes(actual)) valores.push(actual);
  return valores.map((v) => ({ valor: v, texto: TEXTO_VARIANTE[v] ?? v }));
}
