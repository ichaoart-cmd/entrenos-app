import { useEffect, useState } from 'preact/hooks';
import { textoTempo } from '../domain/progreso';
import type { Fuerza, Lugar, Metcon, Sesion } from '../domain/types';
import { ejercicioSugerido, ROTACION, type PR } from '../domain/records';
import { nuevoId } from '../domain/ids';
import { EJERCICIOS_BASE } from '../store/local';
import { borrar, estado, registrar } from '../store/estado';
import { BotonBorrar } from './componentes/BotonBorrar';
import { BENCHMARKS, esMejor, mejorBenchmark } from '../domain/benchmarks';
import { usarPantallaEncendida } from './pantalla';
import { sonar } from './sonido';
import { POOLS, sinRepetir } from './frases';
import { navegar } from './navegacion';
import { AvisoMolestia, SelectorMolestias } from './Molestias';
import { FuerzaForm, fuerzaInicial } from './FuerzaForm';
import { MetconForm } from './MetconForm';
import { Chips } from './componentes/Chips';
import { Aviso } from './componentes/Aviso';
import { nombreEjercicio } from './formato';
import { Selector } from './Selector';

const CLAVE_BORRADOR = 'borrador-registro';
interface Borrador { fecha: string; lugar: Lugar; fuerzas?: Fuerza[]; /** formato antiguo */ fuerza?: Fuerza | null; metcon: Metcon | null; nota: string }

function leerBorrador(): Borrador | null {
  try { const t = localStorage.getItem(CLAVE_BORRADOR); return t ? JSON.parse(t) : null; } catch { return null; }
}
function escribirBorrador(b: Borrador | null): void {
  try { b ? localStorage.setItem(CLAVE_BORRADOR, JSON.stringify(b)) : localStorage.removeItem(CLAVE_BORRADOR); } catch { /* sin almacenamiento */ }
}

export function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const num = (n: number) => String(n).replace('.', ',');

/** «Mejor Fran: 5:10» si el WOD de referencia mejora una marca que ya existía. */
function mejoraBenchmark(s: Sesion, previas: Sesion[]): string | null {
  const m = s.metcon;
  if (!m?.benchmark || !m.resultado) return null;
  const antes = mejorBenchmark(previas, m.benchmark), ahora = mejorBenchmark([...previas, s], m.benchmark);
  if (!antes || !ahora || ahora.fecha !== s.fecha || ahora.valor !== m.resultado.valor || !esMejor(ahora.tipo, ahora.n, antes.n)) return null;
  return `${BENCHMARKS.find((b) => b.id === m.benchmark)?.nombre ?? m.benchmark}: ${ahora.valor}. ${ahora.tipo === 'tiempo' ? 'Más rápido que nunca 🔥' : 'Tu mejor marca 🔥'}`;
}

export function textoPR(pr: PR, ejercicio?: string): string {
  const base = `${sinRepetir('prefijoPR', POOLS.prefijoPR)}${ejercicio ? ` ${nombreEjercicio(ejercicio)}` : ''} ${pr.reps}RM${pr.tempo ? ` a ${textoTempo(pr.tempo)}` : ''}: ${num(pr.kg)} kg`;
  return (pr.anteriorKg == null ? base : `${base} (+${num(Math.round((pr.kg - pr.anteriorKg) * 10) / 10)} kg)`) + sinRepetir('cierrePR', POOLS.cierrePR);
}

/** Metcon de partida para un WOD de referencia. */
function metconDeWod(id: string): Metcon | null {
  const b = BENCHMARKS.find((x) => x.id === id);
  return b ? { formato: b.formato, rx: true, benchmark: b.id, descripcion: b.descripcion, movimientos: [...b.movimientos], ...(b.duracionMin ? { duracionMin: b.duracionMin } : {}) } : null;
}

export function Registrar({ sesionInicial, fechaInicial, ejercicioInicial, abrirSelector = false, wodInicial, soloMetcon = false }: {
  sesionInicial?: Sesion; fechaInicial?: string; ejercicioInicial?: string; abrirSelector?: boolean; wodInicial?: string; soloMetcon?: boolean;
}) {
  const metconPedido = wodInicial ? metconDeWod(wodInicial) : soloMetcon ? { formato: 'AMRAP' as const, rx: true } : null;
  const datos = estado.datos.value;
  // Solo las sesiones nuevas usan borrador; al editar se parte de la sesión guardada.
  const [borrador] = useState(() => (sesionInicial || fechaInicial || ejercicioInicial || metconPedido ? null : leerBorrador()));
  const ejercicios = [...EJERCICIOS_BASE, ...datos.ejercicios.filter((e) => !EJERCICIOS_BASE.some((b) => b.id === e.id))];
  const [fecha, setFecha] = useState(sesionInicial?.fecha ?? fechaInicial ?? borrador?.fecha ?? hoy());
  const [lugar, setLugar] = useState<Lugar>(sesionInicial?.lugar ?? borrador?.lugar ?? 'box');
  const [fuerzas, setFuerzas] = useState<Fuerza[]>(() =>
    sesionInicial ? sesionInicial.fuerza
      : borrador ? borrador.fuerzas ?? (borrador.fuerza ? [borrador.fuerza] : [])
      : metconPedido ? []
      : [fuerzaInicial(ejercicioInicial ?? ejercicioSugerido(datos.sesiones, ROTACION), datos.sesiones)]);
  // Clave estable por bloque, para que cada formulario conserve su estado al quitar otro.
  const [claves, setClaves] = useState<number[]>(() => fuerzas.map((_, i) => i));
  const [eligiendo, setEligiendo] = useState(false);
  const sesionesPrevias = datos.sesiones.filter((x) => x.id !== sesionInicial?.id);
  const cambiarBloque = (i: number) => (f: Fuerza) => setFuerzas((xs) => xs.map((x, j) => (j === i ? f : x)));
  const quitarBloque = (i: number) => { setFuerzas((xs) => xs.filter((_, j) => j !== i)); setClaves((xs) => xs.filter((_, j) => j !== i)); };
  const anadirBloque = (id: string) => {
    setFuerzas((xs) => [...xs, fuerzaInicial(id, sesionesPrevias)]);
    setClaves((xs) => [...xs, Math.max(-1, ...xs) + 1]);
    setEligiendo(false);
  };
  const [metcon, setMetcon] = useState<Metcon | null>(sesionInicial?.metcon ?? borrador?.metcon ?? metconPedido);
  const [nota, setNota] = useState(sesionInicial?.nota ?? borrador?.nota ?? '');
  const [molestias, setMolestias] = useState<string[]>(sesionInicial?.molestias ?? []);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [esRecord, setEsRecord] = useState(false);
  usarPantallaEncendida();

  useEffect(() => {
    // Antes de tener los datos no se guarda borrador: lo calculado aún no es fiable y la pantalla se rehará.
    if (!sesionInicial && !guardando && estado.listo.value) escribirBorrador({ fecha, lugar, fuerzas, metcon, nota });
  }, [fecha, lugar, fuerzas, metcon, nota]);

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    const s: Sesion = {
      id: sesionInicial?.id ?? nuevoId(), actualizado: new Date().toISOString(), fecha, lugar,
      fuerza: fuerzas,
      ...(metcon ? { metcon } : {}), ...(nota.trim() ? { nota: nota.trim() } : {}),
      ...(molestias.length ? { molestias } : {}),
    };
    const previas = estado.datos.value.sesiones.filter((x) => x.id !== s.id);
    let pr;
    try {
      pr = await registrar(s);
    } catch {
      setAviso('No se pudo guardar. Inténtalo otra vez; lo que has puesto sigue aquí.');
      setEsRecord(false);
      setGuardando(false);
      setTimeout(() => setAviso(null), 4000);
      return;
    }
    if (!sesionInicial) escribirBorrador(null);
    const wod = mejoraBenchmark(s, previas);
    setAviso(wod ?? (pr ? textoPR(pr.pr, fuerzas.length > 1 ? pr.ejercicio : undefined) : sinRepetir('guardado', POOLS.guardado)));
    setEsRecord(!!pr || !!wod);
    sonar(pr || wod ? 'record' : 'guardado');
    setTimeout(() => { void navegar('#/'); }, 1800);
  };

  return (
    <main class="pagina">
      {aviso && <Aviso texto={aviso} record={esRecord} />}
      <div class="cabecera-registro">
        <a href="#/" aria-label="Volver" class="volver">←</a>
        <h1>{sesionInicial ? 'Editar' : 'Registrar'}</h1>
        <input type="date" aria-label="Fecha" value={fecha} onInput={(e) => setFecha((e.target as HTMLInputElement).value)} />
      </div>
      <Chips etiqueta="Lugar" opciones={[{ valor: 'box', texto: 'Box' }, { valor: 'casa', texto: 'Casa' }]} valor={lugar} onCambio={setLugar} />
      {fuerzas.map((f, i) => (
        <div class={`bloque-fuerza${i > 0 ? ' siguiente' : ''}`} key={claves[i]}>
          {fuerzas.length > 1 && <div class='num-bloque'>Ejercicio {i + 1}</div>}
          <AvisoMolestia ejercicio={f.ejercicio} excluir={sesionInicial?.id} />
          <FuerzaForm fuerza={f} onCambio={cambiarBloque(i)} ejercicios={ejercicios} sesiones={sesionesPrevias} onQuitar={() => quitarBloque(i)} abrirSelector={i === 0 && abrirSelector} />
        </div>
      ))}
      <button type="button" class="boton" style="margin-top:12px" onClick={() => setEligiendo(true)}>{fuerzas.length ? '＋ Otro ejercicio de fuerza' : '＋ Fuerza'}</button>
      {eligiendo && <Selector onCerrar={() => setEligiendo(false)} onElegir={anadirBloque} />}
      {metcon
        ? <MetconForm metcon={metcon} onCambio={setMetcon} onQuitar={() => setMetcon(null)} />
        : <button type="button" class="boton" style="margin:12px 0 0 8px" onClick={() => setMetcon({ formato: 'AMRAP', rx: true })}>＋ Metcon</button>}
      <SelectorMolestias valor={molestias} onCambio={setMolestias} />
      <textarea aria-label="Nota" placeholder="Nota (opcional)" style="margin-top:12px" value={nota} onInput={(e) => setNota((e.target as HTMLTextAreaElement).value)} />
      <div class="fila"><button type="button" class="primario" disabled={guardando || (!fuerzas.length && !metcon)} onClick={guardar}>Guardar sesión</button></div>
      {sesionInicial && <BotonBorrar texto='Borrar sesión' onBorrar={async () => { await borrar(sesionInicial.id); escribirBorrador(null); void navegar('#/historial'); }} />}
    </main>
  );
}
