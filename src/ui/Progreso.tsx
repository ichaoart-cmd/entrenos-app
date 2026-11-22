import { estado } from '../store/estado';
import { ROTACION, recordsPorReps } from '../domain/records';
import { e1rm, esFiable } from '../domain/rm';
import { EJERCICIOS_BASE } from '../store/local';
import { fechaLarga } from './formato';
import { IconoEjercicio } from './iconos';

const kg = (n: number) => String(Math.round(n * 2) / 2).replace('.', ',');

/** Avance de la fase 2: por ejercicio, el 1RM estimado y los récords por número de reps. */
export function Progreso() {
  const sesiones = estado.datos.value.sesiones;
  const ejercicios = [...EJERCICIOS_BASE].sort((a, b) => {
    const ia = ROTACION.indexOf(a.id), ib = ROTACION.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const filas = ejercicios.map((e) => {
    const r = [...recordsPorReps(sesiones, e.id).values()].sort((a, b) => a.reps - b.reps);
    const fiables = r.filter((m) => esFiable(m.reps));
    const mejor = fiables.reduce<{ v: number; fecha: string } | null>((a, m) => {
      const v = e1rm(m.kg, m.reps);
      return !a || v > a.v ? { v, fecha: m.fecha } : a;
    }, null);
    return { e, r, mejor };
  }).filter((f) => f.r.length);

  return (
    <main class='pagina'>
      <h1>Progreso</h1>
      {filas.length === 0 && <p class='suave'>Registra tu primera sesión de fuerza para ver aquí tus marcas.</p>}
      {filas.map(({ e, r, mejor }) => (
        <section class='ejercicio-progreso' aria-label={e.nombre}>
          <header>
            <span class='disco'><IconoEjercicio id={e.id} size={32} /></span>
            <h3>{e.nombre}</h3>
            {mejor && <div class='rm'><b>{Math.round(mejor.v)} kg</b><span>1RM estimado</span></div>}
          </header>
          <div class='marcas'>
            {r.map((m) => <span title={fechaLarga(m.fecha)}>{m.reps}RM {kg(m.kg)} kg</span>)}
          </div>
        </section>
      ))}
      <p class='suave' style='font-size:0.85rem'>Pronto: gráficas de evolución y tabla de porcentajes.</p>
    </main>
  );
}
