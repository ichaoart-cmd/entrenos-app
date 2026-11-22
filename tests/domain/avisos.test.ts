import { generarAvisos } from '../../src/domain/avisos';
import type { Carrera, Datos, Fuerza, Sesion } from '../../src/domain/types';

const HOY = '2026-11-22';
const f = (ejercicio: string, kg: number, reps = 5, extra: Partial<Fuerza> = {}): Fuerza => ({ ejercicio, reps, series: [kg], ...extra });
const ses = (fecha: string, ...fuerza: Fuerza[]): Sesion => ({ id: fecha + fuerza.map((x) => x.ejercicio).join(), actualizado: '', fecha, lugar: 'box', fuerza });
const run = (fecha: string, km: number, seg: number): Carrera => ({ id: 'c' + fecha + km, actualizado: '', fecha, distanciaKm: km, tiempoSeg: seg });
const datos = (sesiones: Sesion[], carreras: Carrera[] = []): Datos => ({ version: 1, ejercicios: [], sesiones, carreras });
const textos = (d: Datos) => generarAvisos(d, HOY, 3).map((a) => `${a.tipo}: ${a.titulo}`);

test('récord reciente de fuerza', () => {
  const t = textos(datos([ses('2026-09-01', f('back-squat', 90)), ses('2026-11-18', f('back-squat', 95))]));
  expect(t).toContain('logro: ¡PR! 5RM en Back Squat: 95 kg');
});
test('un récord de hace más de 14 días ya no sale', () => {
  const t = textos(datos([ses('2026-09-01', f('back-squat', 90)), ses('2026-10-01', f('back-squat', 95))]));
  expect(t.some((x) => x.startsWith('logro'))).toBe(false);
});
test('ejercicio de la rotación abandonado más de 21 días', () => {
  const t = textos(datos([ses('2026-10-20', f('deadlift', 120)), ses('2026-11-20', f('back-squat', 90))]));
  expect(t).toContain('alerta: Peso muerto te echa de menos (33 días)');
  expect(t.some((x) => x.includes('Back Squat') && x.includes('días'))).toBe(false);
});
test('objetivo no alcanzado dos veces seguidas: sugiere bajar', () => {
  const fallo = (kg: number) => f('press-banca', kg, 3, { repsSeries: [3], objetivo: { series: [kg], reps: [5] } });
  const t = textos(datos([ses('2026-11-10', fallo(70)), ses('2026-11-17', fallo(70))]));
  expect(t).toContain('alerta: Press Banca se te resiste');
});
test('objetivo superado dos veces seguidas: sugiere subir', () => {
  const sup = (kg: number) => f('press-banca', kg, 7, { repsSeries: [7], objetivo: { series: [kg], reps: [5] } });
  const t = textos(datos([ses('2026-11-10', sup(70)), ses('2026-11-17', sup(70))]));
  expect(t).toContain('logro: Press Banca: te sobra peso');
});
test('estancamiento: 5 sesiones sin mejorar el 1RM estimado', () => {
  const s = [ses('2026-06-01', f('front-squat', 100)), ...['07', '08', '09', '10', '11'].map((m) => ses(`2026-${m}-05`, f('front-squat', 95)))];
  expect(textos(datos(s))).toContain('alerta: Front Squat lleva 5 sesiones plano');
});
test('subida brusca de km de carrera', () => {
  const c = [run('2026-10-27', 10, 3000), run('2026-11-03', 10, 3000), run('2026-11-10', 10, 3000), run('2026-11-17', 10, 3000), run('2026-11-21', 16, 4800)];
  expect(textos(datos([], c))).toContain('alerta: Ojo, que te has venido arriba con los km');
});
test('desequilibrio pierna / torso en 30 días', () => {
  const s = ['2026-11-02', '2026-11-09', '2026-11-16'].map((d) => ses(d, f('back-squat', 90)));
  expect(textos(datos(s))).toContain('alerta: Último mes: 3 días de pierna y ni uno de torso. ¿Y esos brazos?');
});
test('semana: cuántos faltan', () => {
  expect(textos(datos([ses('2026-11-17', f('snatch', 60))]))).toContain('info: Llevas 1 de 3 esta semana');
});
test('los logros van antes que las alertas y se limita el número', () => {
  const t = generarAvisos(datos([ses('2026-09-01', f('back-squat', 90)), ses('2026-11-18', f('back-squat', 95))]), HOY, 3, 2);
  expect(t).toHaveLength(2);
  expect(t[0].tipo).toBe('logro');
});

test('varios ejercicios abandonados van en un solo aviso', () => {
  const t = textos(datos([ses('2026-10-20', f('deadlift', 120)), ses('2026-10-10', f('press-banca', 60))]));
  expect(t).toContain('alerta: Tienes abandonados: Press Banca y Peso muerto');
});
test('estancamiento: solo compara con sesiones del mismo tempo y avisa de uno solo', () => {
  const ft = (fecha: string, kg: number, tempo?: string) => ses(fecha, f('front-squat', kg, 5, { tempo }));
  // Las sesiones con tempo pesan menos: no cuentan como estancamiento de las de sin tempo.
  const s = [ft('2026-06-01', 100), ...['07', '08', '09', '10'].map((m) => ft(`2026-${m}-05`, 80, '4s+pausa')), ft('2026-11-05', 98)];
  expect(textos(datos(s)).some((x) => x.includes('plano'))).toBe(false);
});

test('mejor marca en un WOD de referencia reciente', () => {
  const m = (fecha: string, valor: string): Sesion => ({ id: fecha, actualizado: '', fecha, lugar: 'box', fuerza: [], metcon: { formato: 'ForTime', benchmark: 'fran', rx: true, resultado: { tipo: 'tiempo', valor } } });
  expect(textos(datos([m('2026-09-01', '6:00'), m('2026-11-20', '5:30')]))).toContain('logro: Fran: 5:30, tu mejor marca 🔥');
});

test('molestia reciente aparece como alerta', () => {
  const s: Sesion = { id: 'm', actualizado: '', fecha: '2026-11-20', lugar: 'box', fuerza: [], molestias: ['hombro'] };
  expect(textos(datos([s]))).toContain('alerta: Ojo con el hombro (20/11)');
});
