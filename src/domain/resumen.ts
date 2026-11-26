import type { Datos } from './types';
import { detectarPR } from './records';
import { repsDeTop } from './reps';
import { pesosVivos } from './peso';
import { calcularLogros } from './logros';

export interface ResumenMes {
  mes: string; dias: number; diasMesAnterior: number; fuerza: number; metcons: number; carreras: number; km: number;
  /** Kilos totales movidos (peso × repeticiones de cada serie). */
  volumenKg: number;
  records: { ejercicio: string; kg: number; reps: number }[];
  pesoCambio: number | null; pesoFinal: number | null;
  logros: string[];
}

const mesAnterior = (mes: string) => { const d = new Date(mes + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() - 1); return d.toISOString().slice(0, 7); };

export function resumenMes(datos: Datos, mes: string, minSemana = 3): ResumenMes {
  const ses = datos.sesiones.filter((s) => !s.borrado).sort((a, b) => a.fecha.localeCompare(b.fecha));
  const cs = datos.carreras.filter((c) => !c.borrado);
  const enMes = (f: string, m = mes) => f.startsWith(m);
  const dias = (m: string) => new Set([...ses.filter((s) => enMes(s.fecha, m)).map((s) => s.fecha), ...cs.filter((c) => enMes(c.fecha, m)).map((c) => c.fecha)]).size;
  const delMes = ses.filter((s) => enMes(s.fecha));
  const carrerasMes = cs.filter((c) => enMes(c.fecha));

  let volumenKg = 0;
  const mejores = new Map<string, { ejercicio: string; kg: number; reps: number }>();
  for (const s of delMes) {
    const antes = ses.filter((x) => x.fecha < s.fecha);
    for (const f of s.fuerza) {
      f.series.forEach((kg, i) => { volumenKg += kg * (f.repsSeries?.[i] ?? f.reps ?? 0); });
      if (!antes.some((p) => p.fuerza.some((x) => x.ejercicio === f.ejercicio))) continue; // la primera vez no es récord
      const pr = detectarPR(f, s.fecha, antes);
      const reps = repsDeTop(f);
      if (pr && reps != null) {
        const prev = mejores.get(f.ejercicio);
        if (!prev || pr.kg > prev.kg) mejores.set(f.ejercicio, { ejercicio: f.ejercicio, kg: pr.kg, reps });
      }
    }
  }

  const pesos = pesosVivos(datos.pesos ?? []);
  const pesosMes = pesos.filter((p) => enMes(p.fecha));
  const previo = [...pesos].reverse().find((p) => p.fecha < mes) ?? pesosMes[0];
  const final = pesosMes[pesosMes.length - 1];
  const pesoCambio = final && previo && final !== previo ? Math.round((final.kg - previo.kg) * 10) / 10 : null;

  return {
    mes, dias: dias(mes), diasMesAnterior: dias(mesAnterior(mes)),
    fuerza: delMes.filter((s) => s.fuerza.length).length, metcons: delMes.filter((s) => s.metcon).length,
    carreras: carrerasMes.length, km: Math.round(carrerasMes.reduce((a, c) => a + c.distanciaKm, 0) * 10) / 10,
    volumenKg: Math.round(volumenKg),
    records: [...mejores.values()].sort((a, b) => b.kg - a.kg),
    pesoCambio, pesoFinal: final?.kg ?? null,
    logros: calcularLogros(datos, minSemana).filter((l) => l.fecha && enMes(l.fecha)).map((l) => l.nombre),
  };
}
