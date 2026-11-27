import { useState } from 'preact/hooks';
import { estado, quitarPeso, registrarPeso } from '../store/estado';
import { nuevoId } from '../domain/ids';
import type { PesoCorporal } from '../domain/types';
import { cambioPeso, fuerzaRelativaEjercicios, pesosVivos, resumenPeso } from '../domain/peso';
import { ROTACION } from '../domain/records';
import { entrada } from '../domain/catalogo';
import { Stepper } from './componentes/Stepper';
import { Chips } from './componentes/Chips';
import { Etiqueta, pasoBonito } from './Grafica';
import { FONDO, MENTA, MONO, REJILLA, AMARILLO, TEXTO, TINTA } from './coloresGrafica';
import { IconoEjercicio } from './iconos';
import { fechaLarga } from './formato';
import { hoy } from './Registrar';
import { sonar } from './sonido';

const coma = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',');
const conSigno = (n: number) => (n > 0 ? '+' : n < 0 ? '−' : '±') + coma(Math.abs(n));
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const corta = (f: string) => `${Number(f.slice(8))} ${MESES[Number(f.slice(5, 7)) - 1]} ${f.slice(2, 4)}`;
const pesos = () => pesosVivos(estado.datos.value.pesos ?? []);
type Periodo = '3m' | '6m' | '1a' | 'todo';
const DIAS: Record<Periodo, number> = { '3m': 92, '6m': 183, '1a': 365, todo: 0 };

/** Tarjeta de la lista de Progreso: último peso y cómo va el último mes; abre la ficha. */
export function TarjetaPeso() {
  const r = resumenPeso(estado.datos.value.pesos ?? []);
  const mes = cambioPeso(estado.datos.value.pesos ?? [], 30);
  return (
    <a class='ejercicio-progreso enlace-ficha' href='#/progreso?ej=peso' aria-label='Peso corporal'>
      <header>
        <span class='disco'><IconoEjercicio id='bascula' size={32} /></span>
        <div><h3>Peso</h3><span class='suave' style='font-size:0.8rem'>
          {r ? (mes != null ? `${conSigno(mes)} kg en 30 días` : `${r.n} ${r.n === 1 ? 'pesada' : 'pesadas'}`) : 'La báscula te echa de menos'}</span></div>
        {r && <div class='rm'><b>{coma(r.ultimo.kg)} kg</b><span>último</span></div>}
      </header>
    </a>
  );
}

/** Apuntar el peso (hoy u otro día); si ya hay uno ese día, se sustituye. */
function Apuntar() {
  const ps = pesos();
  const ult = ps[ps.length - 1];
  const [kg, setKg] = useState(ult?.kg ?? 75);
  const [fecha, setFecha] = useState(hoy());
  const [hecho, setHecho] = useState(false);
  const esHoy = fecha === hoy();
  const apuntar = async () => {
    if (!fecha) return;
    const mismoDia = ps.find((p) => p.fecha === fecha);
    await registrarPeso({ id: mismoDia?.id ?? nuevoId(), actualizado: '', fecha, kg: Math.round(kg * 10) / 10 });
    sonar('guardado'); setHecho(true); setTimeout(() => setHecho(false), 2000);
  };
  return (
    <section class='tarjeta peso-corporal' aria-label='Apuntar peso'>
      <p class='suave'>{ult ? `Último: ${coma(ult.kg)} kg (${fechaLarga(ult.fecha)}).` : 'Súbete a la báscula de vez en cuando y te digo cuánto mueves respecto a tu peso.'}</p>
      <div class='fila'>
        <Stepper etiqueta='Peso corporal (kg)' valor={kg} paso={0.1} min={30} onCambio={setKg} />
      </div>
      <div class='fila'>
        <span class='etiqueta'>Día</span>
        <input type='date' aria-label='Fecha del peso' value={fecha} max={hoy()} onInput={(e) => setFecha((e.target as HTMLInputElement).value)} />
      </div>
      <div class='fila'>
        <button type='button' class='primario' onClick={apuntar}>{hecho ? 'Apuntado ✓' : esHoy ? 'Apuntar peso de hoy' : 'Apuntar peso'}</button>
      </div>
    </section>
  );
}

/** Evolución del peso: área menta con línea negra gruesa y una pegatina con la cifra (mismo estilo que el resto). */
export function GraficaPeso({ puntos }: { puntos: PesoCorporal[] }) {
  const [activo, setActivo] = useState<number | null>(null);
  if (puntos.length < 2) return <p class='suave'>Con otra pesada aparecerá aquí tu curva. La báscula no muerde.</p>;
  const W = 340, H = 200, izq = 34, der = 14, arriba = 26, abajo = 24;
  const kgs = puntos.map((p) => p.kg);
  const lo = Math.min(...kgs), hi = Math.max(...kgs);
  const paso = pasoBonito(Math.max(hi - lo, 2));
  const yMin = Math.floor((lo - paso / 2) / paso) * paso, yMax = Math.ceil((hi + paso / 2) / paso) * paso;
  const d = (f: string) => Date.parse(f) / 864e5;
  const t0 = d(puntos[0].fecha), t1 = Math.max(d(puntos[puntos.length - 1].fecha), t0 + 1);
  const X = (f: string) => izq + ((d(f) - t0) / (t1 - t0)) * (W - izq - der);
  const Y = (v: number) => arriba + (1 - (v - yMin) / (yMax - yMin || 1)) * (H - arriba - abajo);
  const ticks: number[] = [];
  for (let v = yMin; v <= yMax + 1e-9; v += paso) ticks.push(Math.round(v * 10) / 10);
  const linea = puntos.map((p, i) => `${i ? 'L' : 'M'}${X(p.fecha).toFixed(1)} ${Y(p.kg).toFixed(1)}`).join(' ');
  const area = `${linea} L${X(puntos[puntos.length - 1].fecha).toFixed(1)} ${H - abajo} L${X(puntos[0].fecha).toFixed(1)} ${H - abajo} Z`;
  const mover = (e: PointerEvent) => {
    const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W;
    let m = 0; puntos.forEach((p, i) => { if (Math.abs(X(p.fecha) - x) < Math.abs(X(puntos[m].fecha) - x)) m = i; }); setActivo(m);
  };
  const a = activo != null ? puntos[activo] : null;
  const ult = puntos[puntos.length - 1];
  const previo = activo != null && activo > 0 ? puntos[activo - 1] : null;
  return (
    <figure class='grafica'>
      <svg viewBox={`0 0 ${W} ${H}`} role='img' aria-label={`Peso corporal: de ${coma(puntos[0].kg)} a ${coma(ult.kg)} kg`}
        onPointerMove={mover} onPointerDown={mover} onPointerLeave={() => setActivo(null)} style={{ touchAction: 'pan-y' }}>
        {ticks.map((v) => <g><line x1={izq} x2={W - der} y1={Y(v)} y2={Y(v)} stroke={REJILLA} stroke-dasharray='3 4' /><text x={izq - 6} y={Y(v) + 3.5} text-anchor='end' font-size='10' font-family={MONO} fill={TEXTO}>{coma(v)}</text></g>)}
        <path d={area} fill={MENTA} />
        <line x1={izq} x2={W - der} y1={H - abajo} y2={H - abajo} stroke={TINTA} stroke-width='2.5' />
        {a && <line x1={X(a.fecha)} x2={X(a.fecha)} y1={arriba} y2={H - abajo} stroke={TINTA} stroke-width='1.5' stroke-dasharray='4 3' />}
        <path d={linea} fill='none' stroke={TINTA} stroke-width='3' stroke-linejoin='round' stroke-linecap='round' />
        {puntos.map((p) => <circle cx={X(p.fecha)} cy={Y(p.kg)} r={a === p ? 6.5 : 4.5} fill={a === p ? AMARILLO : FONDO} stroke={TINTA} stroke-width='2' />)}
        <Etiqueta x={X((a ?? ult).fecha)} y={Y((a ?? ult).kg) - 18} texto={coma((a ?? ult).kg)} max={W} />
        <text x={izq} y={H - 6} font-size='10' font-family={MONO} fill={TEXTO}>{corta(puntos[0].fecha)}</text>
        <text x={W - der} y={H - 6} text-anchor='end' font-size='10' font-family={MONO} fill={TEXTO}>{corta(ult.fecha)}</text>
      </svg>
      <figcaption class='detalle' aria-live='polite'>
        {a ? <><b>{fechaLarga(a.fecha)}</b> · {coma(a.kg)} kg{previo ? ` (${conSigno(a.kg - previo.kg)} kg)` : ''}</>
          : <span class='suave'>Toca la gráfica para ver cada pesada</span>}
      </figcaption>
    </figure>
  );
}

export function FichaPeso() {
  const [periodo, setPeriodo] = useState<Periodo>('6m');
  const [hist, setHist] = useState(false);
  const todos = pesos();
  const lista = estado.datos.value.pesos ?? [];
  const r = resumenPeso(lista);
  const corte = DIAS[periodo] ? new Date(Date.now() - DIAS[periodo] * 864e5).toISOString().slice(0, 10) : '';
  const puntos = todos.filter((p) => p.fecha >= corte);
  const cambios = ([[7, 'en 7 días'], [30, 'en 30 días'], [90, 'en 3 meses']] as const)
    .map(([dias, texto]) => ({ texto, kg: cambioPeso(lista, dias) })).filter((c) => c.kg != null);
  const relativas = fuerzaRelativaEjercicios(estado.datos.value.sesiones, lista, ROTACION, hoy());

  return (
    <main class='pagina'>
      <div class='cabecera-registro'>
        <a href='#/progreso' aria-label='Volver' class='volver'>←</a>
        <h1>Peso corporal</h1>
      </div>
      {r && (
        <div class='tarjeta resumen-rm resumen-peso'>
          <div><b>{coma(r.ultimo.kg)} kg</b><span>{fechaLarga(r.ultimo.fecha)}</span></div>
          <div class='estimados'>
            {cambios.map((c) => <span><small>{c.texto}</small>{conSigno(c.kg!)} kg</span>)}
            {r.n > 1 && <span><small>desde el inicio</small>{conSigno(r.ultimo.kg - r.primero.kg)} kg</span>}
            {r.n > 1 && <span><small>mín · máx</small>{coma(r.min)} · {coma(r.max)}</span>}
          </div>
        </div>
      )}
      <Apuntar />
      {todos.length > 0 && <>
        <h2>Evolución</h2>
        <Chips etiqueta='Periodo' opciones={[{ valor: '3m', texto: '3 meses' }, { valor: '6m', texto: '6 meses' }, { valor: '1a', texto: '1 año' }, { valor: 'todo', texto: 'Todo' }]}
          valor={periodo} onCambio={(v) => setPeriodo(v as Periodo)} />
        <div class='tarjeta'>
          {puntos.length ? <GraficaPeso puntos={puntos} /> : <p class='suave'>No te pesaste en este periodo. Prueba con «Todo».</p>}
          <button type='button' class='enlace' aria-expanded={hist} onClick={() => setHist(!hist)}>{hist ? 'Ocultar pesadas' : 'Ver pesadas'}</button>
          {hist && (
            <ul class='hist-peso'>
              {[...todos].reverse().map((p) => <li><span>{fechaLarga(p.fecha)}</span><b>{coma(p.kg)} kg</b><button type='button' class='enlace' aria-label={`Borrar peso del ${fechaLarga(p.fecha)}`} onClick={() => quitarPeso(p.id)}>Borrar</button></li>)}
            </ul>
          )}
        </div>
      </>}
      {relativas.length > 0 && <>
        <h2>Fuerza relativa</h2>
        <div class='tarjeta tabla-carrera relativa-peso'>
          <p class='suave' style='margin:0 0 6px'>Tu 1RM estimado dividido entre lo que pesas. Si sube, eres más fuerte para tu tamaño, aunque cambie la báscula.</p>
          {relativas.map((x) => (
            <div><span>{entrada(x.id)?.nombre ?? x.id}</span><b>{coma2(x.ahora)} ×</b>
              {x.antes != null && <small>{`hace 6 meses ${coma2(x.antes)} × (${x.ahora >= x.antes ? '+' : '−'}${coma2(Math.abs(x.ahora - x.antes))})`}</small>}</div>
          ))}
        </div>
      </>}
    </main>
  );
}

const coma2 = (n: number) => (Math.round(n * 100) / 100).toFixed(2).replace('.', ',');
