import type { Datos, Sesion } from './types';
import { ROTACION } from './records';
import { repsDeTop } from './reps';
import { e1rm } from './rm';
import { estadoSerie } from './objetivo';
import { DISTANCIAS, formatearTiempo, kmPorSemana, mejoresTiempos } from './carrera';
import { tiposDeSesion } from './tipos';
import { entrada } from './catalogo';
import { conTempo } from './progreso';

export interface AvisoEntreno { tipo: 'logro' | 'alerta' | 'info'; titulo: string; texto?: string; href?: string }

const nombre = (id: string) => entrada(id)?.nombre ?? id;
const dias = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);
const menos = (hoy: string, n: number) => new Date(Date.parse(`${hoy}T00:00:00Z`) - n * 864e5).toISOString().slice(0, 10);
const coma = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');

/** Una entrada por vez que se hizo cada ejercicio, por fecha ascendente. */
function historico(sesiones: Sesion[]) {
  const r: { fecha: string; f: Sesion['fuerza'][number] }[] = [];
  for (const s of sesiones) if (!s.borrado) for (const f of s.fuerza) if (f.series.length) r.push({ fecha: s.fecha, f });
  return r.sort((a, b) => a.fecha.localeCompare(b.fecha));
}

/** Logros recientes, alertas para mejorar y estado de la semana. Primero logros, luego alertas, luego info. */
export function generarAvisos(d: Datos, hoy: string, minSemana: number, max = 5): AvisoEntreno[] {
  const logros: AvisoEntreno[] = [], alertas: AvisoEntreno[] = [], info: AvisoEntreno[] = [];
  const hist = historico(d.sesiones);
  const hace14 = menos(hoy, 14);

  // Récords de fuerza de las últimas 2 semanas (el primer registro de un ejercicio no cuenta).
  const mejor = new Map<string, number>();
  for (const { fecha, f } of hist) {
    const r = repsDeTop(f); if (r == null) continue;
    const k = `${f.ejercicio}|${r}`, kg = Math.max(...f.series), prev = mejor.get(k);
    if (prev != null && kg > prev && fecha >= hace14)
      logros.push({ tipo: 'logro', titulo: `Nuevo ${r}RM en ${nombre(f.ejercicio)}: ${coma(kg)} kg`, texto: `${coma(kg - prev)} kg más que tu marca anterior.`, href: `#/progreso?ej=${f.ejercicio}` });
    if (prev == null || kg > prev) mejor.set(k, kg);
  }

  // Mejores marcas de carrera de las últimas 2 semanas.
  const cs = d.carreras.filter((c) => !c.borrado).sort((a, b) => a.fecha.localeCompare(b.fecha));
  cs.forEach((c, i) => {
    if (c.fecha < hace14) return;
    const antes = mejoresTiempos(cs.slice(0, i)), con = mejoresTiempos(cs.slice(0, i + 1));
    for (const m of con) {
      const a = antes.find((x) => x.km === m.km);
      if (a && m.seg < a.seg) logros.push({ tipo: 'logro', titulo: `Mejor ${DISTANCIAS.find((x) => x.km === m.km)!.nombre}: ${formatearTiempo(m.seg)}`, href: '#/progreso?ej=carrera' });
    }
  });

  const porEjercicio = new Map<string, typeof hist>();
  for (const h of hist) porEjercicio.set(h.f.ejercicio, [...(porEjercicio.get(h.f.ejercicio) ?? []), h]);

  // Objetivo fallado o superado en las dos últimas veces (en los últimos 60 días).
  for (const [id, hs] of porEjercicio) {
    const ult = hs.slice(-2);
    if (ult.length < 2 || ult[0].fecha < menos(hoy, 60) || !ult.every((h) => h.f.objetivo)) continue;
    const estados = ult.map(({ f }) => f.series.map((kg, i) => estadoSerie(kg, f.repsSeries?.[i] ?? f.reps ?? 0, f.objetivo!.series[i] ?? kg, f.objetivo!.reps[i] ?? 0)));
    if (estados.every((e) => e.includes('no-alcanzado')))
      alertas.push({ tipo: 'alerta', titulo: `${nombre(id)}: no llegaste al objetivo las 2 últimas veces`, texto: 'Prueba a bajar 2,5 kg la serie top y consolidar antes de volver a subir.', href: `#/progreso?ej=${id}` });
    else if (estados.every((e) => !e.includes('no-alcanzado') && e.includes('superado')))
      logros.push({ tipo: 'logro', titulo: `${nombre(id)}: has superado el objetivo 2 veces seguidas`, texto: 'Puedes subir 2,5 kg la serie top la próxima vez.', href: `#/registrar?ej=${id}` });
  }

  // Estancamiento: 5 sesiones o más sin superar el mejor 1RM estimado, comparando solo con el mismo tipo de tempo
  // que la última vez (con tempo se mueve menos peso). Solo el caso más largo, para no saturar.
  let peor: { id: string; sin: number; fecha: string } | null = null;
  for (const [id, todas] of porEjercicio) {
    const ultima = todas[todas.length - 1];
    if (ultima.fecha < menos(hoy, 60)) continue;
    const hs = todas.filter((h) => conTempo(h.f.tempo) === conTempo(ultima.f.tempo));
    if (hs.length < 6) continue;
    const vals = hs.map(({ f }) => e1rm(Math.max(...f.series), repsDeTop(f) ?? 1));
    let iMejor = 0; vals.forEach((v, i) => { if (v > vals[iMejor]) iMejor = i; });
    const sin = vals.length - 1 - iMejor;
    if (sin >= 5 && (!peor || sin > peor.sin)) peor = { id, sin, fecha: hs[iMejor].fecha };
  }
  if (peor) alertas.push({ tipo: 'alerta', titulo: `${nombre(peor.id)}: ${peor.sin} sesiones sin mejorar`, texto: `Tu mejor 1RM estimado es del ${peor.fecha.split('-').reverse().join('/')}. Prueba otro rango de reps o una semana de descarga.`, href: `#/progreso?ej=${peor.id}` });

  // Ejercicios de la rotación abandonados (un solo aviso).
  const olvidados = ROTACION.map((id) => ({ id, ult: porEjercicio.get(id)?.at(-1)?.fecha }))
    .filter((x): x is { id: string; ult: string } => !!x.ult && dias(x.ult, hoy) > 21)
    .sort((a, b) => a.ult.localeCompare(b.ult));
  if (olvidados.length === 1)
    alertas.push({ tipo: 'alerta', titulo: `Hace ${dias(olvidados[0].ult, hoy)} días que no haces ${nombre(olvidados[0].id)}`, href: `#/registrar?ej=${olvidados[0].id}` });
  else if (olvidados.length > 1)
    alertas.push({
      tipo: 'alerta',
      titulo: `Hace tiempo que no haces ${olvidados.slice(0, -1).map((x) => nombre(x.id)).join(', ')} ni ${nombre(olvidados.at(-1)!.id)}`,
      texto: olvidados.map((x) => `${nombre(x.id)}: ${dias(x.ult, hoy)} días`).join(' · '),
      href: `#/registrar?ej=${olvidados[0].id}`,
    });

  // Km de carrera: subida brusca respecto a las 4 semanas anteriores.
  const sem = kmPorSemana(cs, 5, hoy), previas = sem.slice(0, 4), media = previas.reduce((a, s) => a + s.km, 0) / 4, esta = sem[4].km;
  if (previas.filter((s) => s.km > 0).length >= 2 && esta > media * 1.3 && esta - media >= 5)
    alertas.push({ tipo: 'alerta', titulo: 'Has subido mucho los km esta semana', texto: `${coma(esta)} km frente a ${coma(media)} de media. Subir más de un 10 % por semana aumenta el riesgo de lesión.`, href: '#/progreso?ej=carrera' });

  // Desequilibrio pierna / torso en el último mes.
  const mes = d.sesiones.filter((s) => !s.borrado && s.fecha > menos(hoy, 30) && s.fecha <= hoy);
  const diasCon = (t: 'pierna' | 'torso') => new Set(mes.filter((s) => tiposDeSesion(s).includes(t)).map((s) => s.fecha)).size;
  const p = diasCon('pierna'), t = diasCon('torso');
  if (p >= 3 && t === 0) alertas.push({ tipo: 'alerta', titulo: `Último mes: ${p} días de pierna y ninguno de torso` });
  if (t >= 3 && p === 0) alertas.push({ tipo: 'alerta', titulo: `Último mes: ${t} días de torso y ninguno de pierna` });

  // Semana en curso.
  const lunes = sem[4].lunes;
  const n = [...d.sesiones.filter((s) => !s.borrado), ...cs].filter((x) => x.fecha >= lunes && x.fecha <= hoy).length;
  info.push(n >= minSemana
    ? { tipo: 'info', titulo: `Semana cumplida: ${n} entrenos` }
    : { tipo: 'info', titulo: `Esta semana: ${n} de ${minSemana} entrenos`, texto: `Te ${minSemana - n === 1 ? 'falta 1' : `faltan ${minSemana - n}`} para mantener la racha.` });

  return [...[...logros.reverse(), ...alertas].slice(0, Math.max(0, max - info.length)), ...info];
}
