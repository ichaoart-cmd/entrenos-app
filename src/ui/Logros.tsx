import { useEffect, useState } from 'preact/hooks';
import { estado } from '../store/estado';
import { calcularLogros, type Familia, type Logro } from '../domain/logros';
import { IconoEjercicio } from './iconos';
import { fechaLarga } from './formato';
import { sonar } from './sonido';

const FAMILIAS: Familia[] = ['Constancia', 'Fuerza', 'Metcon', 'Carrera', 'Báscula'];
const CLAVE_VISTOS = 'entrenos-logros-vistos';
const coma = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

const logros = () => calcularLogros(estado.datos.value, estado.ajustes.value.minSesionesSemana);

/** Medalla: disco con la ilustración; bloqueada se ve apagada y con candado. */
function Medalla({ l, size = 64 }: { l: Logro; size?: number }) {
  return (
    <span class={`medalla ${l.nivel}${l.fecha ? '' : ' bloqueada'}`} style={{ width: size, height: size }} aria-hidden='true'>
      <IconoEjercicio id={l.icono} size={Math.round(size * 0.62)} />
      {!l.fecha && <svg class='candado' viewBox='0 0 16 16' width='18' height='18'><rect x='2.5' y='7' width='11' height='8' rx='2' fill='#141414' /><path d='M5 7V5a3 3 0 0 1 6 0v2' fill='none' stroke='#141414' stroke-width='2' /></svg>}
    </span>
  );
}

/** Tarjeta de la lista de Progreso. */
export function TarjetaLogros() {
  const ls = logros();
  const hechos = ls.filter((l) => l.fecha);
  const ultimo = [...hechos].sort((a, b) => (b.fecha! > a.fecha! ? 1 : -1))[0];
  return (
    <a class='ejercicio-progreso enlace-ficha tarjeta-logros' href='#/logros' aria-label='Logros'>
      <header>
        {ultimo ? <Medalla l={ultimo} size={52} /> : <span class='disco'><IconoEjercicio id='back-squat' size={32} /></span>}
        <div><h3>Logros</h3><span class='suave' style='font-size:0.8rem'>{ultimo ? `Último: ${ultimo.nombre}` : 'Aún no has desbloqueado nada'}</span></div>
        <div class='rm'><b>{hechos.length}/{ls.length}</b><span>desbloqueados</span></div>
      </header>
    </a>
  );
}

/** Vitrina con todos los logros, por familia. Lo bloqueado enseña cuánto falta. */
export function Vitrina() {
  const ls = logros();
  const hechos = ls.filter((l) => l.fecha).length;
  return (
    <main class='pagina vitrina'>
      <div class='cabecera-registro'>
        <a href='#/progreso' aria-label='Volver' class='volver'>←</a>
        <h1>Logros</h1>
      </div>
      <p class='marcador'><span>HI-SCORE</span><b>{String(hechos).padStart(2, '0')}/{ls.length}</b></p>
      {FAMILIAS.map((f) => {
        const deF = ls.filter((l) => l.familia === f);
        return (
          <section aria-label={f}>
            <h2>{f}</h2>
            <div class='rejilla-logros'>
              {deF.map((l) => (
                <div class={`logro${l.fecha ? '' : ' bloqueado'}`} aria-label={`${l.nombre}${l.fecha ? ', conseguido' : ', bloqueado'}`}>
                  <Medalla l={l} />
                  <b>{l.nombre}</b>
                  <small>{l.descripcion}</small>
                  {l.fecha ? <small class='cuando'>{fechaLarga(l.fecha)}</small> : (
                    <span class='progreso-logro' title={`${coma(l.progreso.actual)} de ${coma(l.progreso.meta)}`}>
                      <i style={{ width: `${Math.min(100, (l.progreso.actual / l.progreso.meta) * 100)}%` }} />
                      <small>{coma(l.progreso.actual)}/{coma(l.progreso.meta)}</small>
                    </span>
                  )}
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}

function leerVistos(): Set<string> | null {
  try { const t = localStorage.getItem(CLAVE_VISTOS); return t ? new Set(JSON.parse(t)) : null; } catch { return new Set(); }
}
function guardarVistos(ids: string[]) { try { localStorage.setItem(CLAVE_VISTOS, JSON.stringify(ids)); } catch { /* sin almacenamiento */ } }

/** Pantallazo arcade cuando se desbloquea algo nuevo. La primera vez solo resume lo que ya tenías. */
export function CelebracionLogro() {
  const [nuevos, setNuevos] = useState<Logro[]>([]);
  const [primeraVez, setPrimeraVez] = useState(0);
  const datos = estado.datos.value;
  useEffect(() => {
    if (!estado.listo.value) return;
    const hechos = logros().filter((l) => l.fecha);
    if (!hechos.length) return;
    const vistos = leerVistos();
    if (vistos == null) { guardarVistos(hechos.map((l) => l.id)); setPrimeraVez(hechos.length); return; }
    const nuevos = hechos.filter((l) => !vistos.has(l.id));
    if (nuevos.length) { guardarVistos(hechos.map((l) => l.id)); setNuevos(nuevos); sonar('record'); }
  }, [datos, estado.listo.value]);
  const cerrar = () => { setNuevos([]); setPrimeraVez(0); };
  if (!nuevos.length && !primeraVez) return null;
  const l = nuevos[0];
  return (
    <div class='celebracion-logro' role='dialog' aria-label='Logro desbloqueado' onClick={cerrar}>
      <div class='caja'>
        <p class='parpadeo'>{l ? '¡LOGRO DESBLOQUEADO!' : '¡NUEVA SECCIÓN: LOGROS!'}</p>
        {l ? <>
          <Medalla l={l} size={110} />
          <h2>{l.nombre}</h2>
          <p>{l.descripcion}</p>
          {nuevos.length > 1 && <p class='suave'>…y {nuevos.length - 1} más</p>}
        </> : <p>Ya llevas <b>{primeraVez}</b> desbloqueados con lo que has entrenado hasta hoy.</p>}
        <div class='acciones-logro'>
          <a class='boton primario' href='#/logros' onClick={cerrar}>Ver vitrina</a>
          <button type='button' class='enlace' onClick={cerrar}>Seguir</button>
        </div>
      </div>
    </div>
  );
}
