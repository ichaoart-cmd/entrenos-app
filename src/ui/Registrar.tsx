import { useEffect, useState } from 'preact/hooks';
import type { Fuerza, Lugar, Metcon, Sesion } from '../domain/types';
import { ejercicioSugerido, ROTACION, type PR } from '../domain/records';
import { nuevoId } from '../domain/ids';
import { EJERCICIOS_BASE } from '../store/local';
import { borrar, estado, registrar } from '../store/estado';
import { BotonBorrar } from './componentes/BotonBorrar';
import { FuerzaForm, fuerzaInicial } from './FuerzaForm';
import { MetconForm } from './MetconForm';
import { Chips } from './componentes/Chips';
import { Aviso } from './componentes/Aviso';
import { resumenFuerza } from './formato';

const CLAVE_BORRADOR = 'borrador-registro';
interface Borrador { fecha: string; lugar: Lugar; fuerza: Fuerza | null; metcon: Metcon | null; nota: string }

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

export function textoPR(pr: PR): string {
  const base = `Nuevo ${pr.reps}RM: ${num(pr.kg)} kg`;
  return pr.anteriorKg == null ? base : `${base} (+${num(Math.round((pr.kg - pr.anteriorKg) * 10) / 10)} kg)`;
}

export function Registrar({ sesionInicial, fechaInicial, ejercicioInicial, abrirSelector = false }: { sesionInicial?: Sesion; fechaInicial?: string; ejercicioInicial?: string; abrirSelector?: boolean }) {
  const datos = estado.datos.value;
  // Solo las sesiones nuevas usan borrador; al editar se parte de la sesión guardada.
  const [borrador] = useState(() => (sesionInicial || fechaInicial || ejercicioInicial ? null : leerBorrador()));
  // Bloques de fuerza adicionales (p. ej. sesiones importadas con varios levantamientos): se conservan siempre.
  const extras = sesionInicial?.fuerza.slice(1) ?? [];
  const ejercicios = [...EJERCICIOS_BASE, ...datos.ejercicios.filter((e) => !EJERCICIOS_BASE.some((b) => b.id === e.id))];
  const [fecha, setFecha] = useState(sesionInicial?.fecha ?? fechaInicial ?? borrador?.fecha ?? hoy());
  const [lugar, setLugar] = useState<Lugar>(sesionInicial?.lugar ?? borrador?.lugar ?? 'box');
  const [fuerza, setFuerza] = useState<Fuerza | null>(() =>
    sesionInicial ? sesionInicial.fuerza[0] ?? null
      : borrador ? borrador.fuerza
      : fuerzaInicial(ejercicioInicial ?? ejercicioSugerido(datos.sesiones, ROTACION), datos.sesiones));
  const [metcon, setMetcon] = useState<Metcon | null>(sesionInicial?.metcon ?? borrador?.metcon ?? null);
  const [nota, setNota] = useState(sesionInicial?.nota ?? borrador?.nota ?? '');
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [esRecord, setEsRecord] = useState(false);

  useEffect(() => {
    if (!sesionInicial && !guardando) escribirBorrador({ fecha, lugar, fuerza, metcon, nota });
  }, [fecha, lugar, fuerza, metcon, nota]);

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    const s: Sesion = {
      id: sesionInicial?.id ?? nuevoId(), actualizado: new Date().toISOString(), fecha, lugar,
      fuerza: [...(fuerza ? [fuerza] : []), ...extras],
      ...(metcon ? { metcon } : {}), ...(nota.trim() ? { nota: nota.trim() } : {}),
    };
    const pr = await registrar(s);
    if (!sesionInicial) escribirBorrador(null);
    setAviso(pr ? textoPR(pr) : 'Guardado ✓');
    setEsRecord(!!pr);
    setTimeout(() => { location.hash = '#/'; }, 1800);
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
      {fuerza
        ? <FuerzaForm fuerza={fuerza} onCambio={setFuerza} ejercicios={ejercicios} sesiones={datos.sesiones.filter((x) => x.id !== sesionInicial?.id)} onQuitar={() => setFuerza(null)} abrirSelector={abrirSelector} />
        : <button type="button" class="boton" style="margin-top:12px" onClick={() => setFuerza(fuerzaInicial(ejercicioSugerido(datos.sesiones, ROTACION), datos.sesiones))}>＋ Fuerza</button>}
      {extras.length > 0 && (
        <section class="tarjeta">
          <div class="suave">También en esta sesión</div>
          <div>{resumenFuerza({ ...sesionInicial!, fuerza: extras })}</div>
        </section>
      )}
      {metcon
        ? <MetconForm metcon={metcon} onCambio={setMetcon} onQuitar={() => setMetcon(null)} />
        : <button type="button" class="boton" style="margin:12px 0 0 8px" onClick={() => setMetcon({ formato: 'AMRAP', rx: true })}>＋ Metcon</button>}
      <textarea aria-label="Nota" placeholder="Nota (opcional)" style="margin-top:12px" value={nota} onInput={(e) => setNota((e.target as HTMLTextAreaElement).value)} />
      <div class="fila"><button type="button" class="primario" disabled={guardando || (!fuerza && !metcon && extras.length === 0)} onClick={guardar}>Guardar sesión</button></div>
      {sesionInicial && <BotonBorrar texto='Borrar sesión' onBorrar={async () => { await borrar(sesionInicial.id); escribirBorrador(null); location.hash = '#/historial'; }} />}
    </main>
  );
}
