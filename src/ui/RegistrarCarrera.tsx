import { useState } from 'preact/hooks';
import type { Carrera } from '../domain/types';
import { nuevoId } from '../domain/ids';
import { formatearRitmo, formatearTiempo, partirTiempo } from '../domain/carrera';
import { estado, quitarCarrera, registrarCarrera } from '../store/estado';
import { BotonBorrar } from './componentes/BotonBorrar';
import { usarPantallaEncendida } from './pantalla';
import { sonar } from './sonido';
import { GUARDADO, elegir } from './frases';
import { navegar } from './navegacion';
import { AvisoMolestia, SelectorMolestias } from './Molestias';
import { Chips } from './componentes/Chips';
import { Stepper } from './componentes/Stepper';
import { Aviso } from './componentes/Aviso';
import { hoy } from './Registrar';

export const TIPOS_CARRERA = [
  { valor: 'rodaje', texto: 'Rodaje' }, { valor: 'series', texto: 'Series' },
  { valor: 'tirada larga', texto: 'Tirada larga' }, { valor: 'competición', texto: 'Competición' },
];

export const ESFUERZOS = [
  { valor: '1', texto: 'Suave' }, { valor: '2', texto: 'Cómodo' }, { valor: '3', texto: 'Duro' },
  { valor: '4', texto: 'Muy duro' }, { valor: '5', texto: 'Al límite' },
];

export function RegistrarCarrera({ carreraInicial, fechaInicial }: { carreraInicial?: Carrera; fechaInicial?: string }) {
  // Una carrera nueva parte de la última: mismo tipo, distancia y tiempo.
  const ult = estado.datos.value.carreras.filter((c) => !c.borrado).reduce<Carrera | null>((a, c) => (!a || c.fecha > a.fecha ? c : a), null);
  const base = carreraInicial ?? ult;
  const t0 = partirTiempo(base?.tiempoSeg ?? 1800);
  const [fecha, setFecha] = useState(carreraInicial?.fecha ?? fechaInicial ?? hoy());
  const [tipo, setTipo] = useState(base?.tipo ?? 'rodaje');
  const [km, setKm] = useState(base?.distanciaKm ?? 5);
  const [h, setH] = useState(t0.h), [m, setM] = useState(t0.m), [s, setS] = useState(t0.s);
  const [nota, setNota] = useState(carreraInicial?.nota ?? '');
  const [esfuerzo, setEsfuerzo] = useState<string | undefined>(carreraInicial?.esfuerzo != null ? String(carreraInicial.esfuerzo) : undefined);
  const [fc, setFc] = useState(carreraInicial?.fcMedia ?? 0);
  const [desnivel, setDesnivel] = useState(carreraInicial?.desnivelM ?? 0);
  const [molestias, setMolestias] = useState<string[]>(carreraInicial?.molestias ?? []);
  const [aviso, setAviso] = useState<{ texto: string; record: boolean } | null>(null);
  const [guardando, setGuardando] = useState(false);
  usarPantallaEncendida();
  const seg = Math.round(h * 3600 + m * 60 + s);
  const valida = km > 0 && seg > 0;

  const guardar = async () => {
    if (guardando || !valida) return;
    setGuardando(true);
    const c: Carrera = {
      ...(carreraInicial ?? {}), id: carreraInicial?.id ?? nuevoId(), actualizado: new Date().toISOString(),
      fecha, tipo, distanciaKm: km, tiempoSeg: seg, ...(nota.trim() ? { nota: nota.trim() } : {}),
    };
    if (!nota.trim()) delete c.nota;
    // 0 o sin elegir = sin dato.
    if (esfuerzo) c.esfuerzo = Number(esfuerzo); else delete c.esfuerzo;
    if (fc > 0) c.fcMedia = Math.round(fc); else delete c.fcMedia;
    if (desnivel > 0) c.desnivelM = Math.round(desnivel); else delete c.desnivelM;
    if (molestias.length) c.molestias = molestias; else delete c.molestias;
    let mejora;
    try {
      mejora = await registrarCarrera(c);
    } catch {
      setAviso({ texto: 'No se pudo guardar. Inténtalo otra vez.', record: false });
      setGuardando(false);
      setTimeout(() => setAviso(null), 4000);
      return;
    }
    sonar(mejora ? 'record' : 'guardado');
    setAviso(mejora ? { texto: `Nuevo mejor ${mejora.nombre}: ${formatearTiempo(mejora.seg)}. Vuelas 🔥`, record: true } : { texto: elegir(GUARDADO), record: false });
    setTimeout(() => { void navegar('#/'); }, 1800);
  };

  return (
    <main class='pagina'>
      {aviso && <Aviso texto={aviso.texto} record={aviso.record} />}
      <div class='cabecera-registro'>
        <a href='#/' aria-label='Volver' class='volver'>←</a>
        <h1>{carreraInicial ? 'Editar carrera' : 'Carrera'}</h1>
        <input type='date' aria-label='Fecha' value={fecha} onInput={(e) => setFecha((e.target as HTMLInputElement).value)} />
      </div>
      {carreraInicial?.stravaId != null && (
        <p class='origen-strava'>De Strava</p>
      )}
      <AvisoMolestia ejercicio='correr' excluir={carreraInicial?.id} />
      <Chips etiqueta='Tipo de carrera' opciones={TIPOS_CARRERA} valor={tipo} onCambio={setTipo} />

      <div class='etiq'>Distancia (km)</div>
      <div class='peso-grande'>
        <Stepper etiqueta='Distancia (km)' valor={km} paso={0.5} onCambio={setKm} />
      </div>

      <div class='etiq'>Tiempo</div>
      <div class='tiempo-carrera'>
        <Stepper etiqueta='Horas' valor={h} paso={1} onCambio={(v) => setH(Math.floor(v))} />
        <Stepper etiqueta='Minutos' valor={m} paso={1} onCambio={(v) => setM(Math.floor(v))} />
        <Stepper etiqueta='Segundos' valor={s} paso={5} onCambio={(v) => setS(Math.floor(v))} />
      </div>

      <div class='ritmo' aria-live='polite'>
        {valida ? <><b>{formatearRitmo(seg / km)}</b><span>/km de ritmo medio · {formatearTiempo(seg)} en total</span></>
          : <span class='suave'>Mete distancia y tiempo y te digo a qué ritmo vas</span>}
      </div>

      <div class='etiq'>¿Cómo de duro? <small>(opcional: así ves si mejoras sufriendo lo mismo)</small></div>
      <Chips etiqueta='Esfuerzo' opciones={ESFUERZOS} valor={esfuerzo} onCambio={(v) => setEsfuerzo(v === esfuerzo ? undefined : v)} />
      <div class='minis datos-carrera'>
        <Stepper etiqueta='FC media' valor={fc} paso={1} onCambio={setFc} />
        <Stepper etiqueta='Desnivel (m)' valor={desnivel} paso={10} onCambio={setDesnivel} />
      </div>
      <p class='pista-texto'>¿No lo sabes? Déjalo en 0. La FC media está en Mi Fitness, en el detalle del entreno.</p>

      <SelectorMolestias valor={molestias} onCambio={setMolestias} />
      <textarea aria-label='Nota' placeholder='Nota (opcional)' value={nota} onInput={(e) => setNota((e.target as HTMLTextAreaElement).value)} />
      <div class='fila'><button type='button' class='primario' disabled={guardando || !valida} onClick={guardar}>Guardar carrera</button></div>
      {carreraInicial && <BotonBorrar texto='Borrar carrera' onBorrar={async () => { await quitarCarrera(carreraInicial.id); void navegar('#/historial'); }} />}
    </main>
  );
}
