import { useState } from 'preact/hooks';
import type { Fuerza, Lugar, Metcon, Sesion } from '../domain/types';
import { ejercicioSugerido, ROTACION, type PR } from '../domain/records';
import { nuevoId } from '../domain/ids';
import { EJERCICIOS_BASE } from '../store/local';
import { estado, registrar } from '../store/estado';
import { FuerzaForm, fuerzaInicial } from './FuerzaForm';
import { MetconForm } from './MetconForm';
import { Chips } from './componentes/Chips';
import { Aviso } from './componentes/Aviso';

export function hoy(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const num = (n: number) => String(n).replace('.', ',');

export function textoPR(pr: PR): string {
  const base = `Nuevo ${pr.reps}RM: ${num(pr.kg)} kg`;
  return pr.anteriorKg == null ? base : `${base} (+${num(Math.round((pr.kg - pr.anteriorKg) * 10) / 10)} kg)`;
}

export function Registrar({ sesionInicial }: { sesionInicial?: Sesion }) {
  const datos = estado.datos.value;
  const ejercicios = [...EJERCICIOS_BASE, ...datos.ejercicios.filter((e) => !EJERCICIOS_BASE.some((b) => b.id === e.id))];
  const [fecha, setFecha] = useState(sesionInicial?.fecha ?? hoy());
  const [lugar, setLugar] = useState<Lugar>(sesionInicial?.lugar ?? 'box');
  const [fuerza, setFuerza] = useState<Fuerza | null>(() =>
    sesionInicial ? sesionInicial.fuerza[0] ?? null : fuerzaInicial(ejercicioSugerido(datos.sesiones, ROTACION), datos.sesiones));
  const [metcon, setMetcon] = useState<Metcon | null>(sesionInicial?.metcon ?? null);
  const [nota, setNota] = useState(sesionInicial?.nota ?? '');
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (guardando) return;
    setGuardando(true);
    const s: Sesion = {
      id: sesionInicial?.id ?? nuevoId(), actualizado: new Date().toISOString(), fecha, lugar,
      fuerza: fuerza ? [fuerza, ...(sesionInicial?.fuerza.slice(1) ?? [])] : [],
      ...(metcon ? { metcon } : {}), ...(nota.trim() ? { nota: nota.trim() } : {}),
    };
    const pr = await registrar(s);
    setAviso(pr ? textoPR(pr) : 'Guardado ✓');
    setTimeout(() => { location.hash = '#/'; }, 1800);
  };

  return (
    <main class="pagina">
      {aviso && <Aviso texto={aviso} />}
      <h1>{sesionInicial ? 'Editar sesión' : 'Registrar'}</h1>
      <div class="fila">
        <label class="etiqueta">Fecha <input type="date" aria-label="Fecha" value={fecha} onInput={(e) => setFecha((e.target as HTMLInputElement).value)} /></label>
        <Chips etiqueta="Lugar" opciones={[{ valor: 'box', texto: 'Box' }, { valor: 'casa', texto: 'Casa' }]} valor={lugar} onCambio={setLugar} />
      </div>
      {fuerza
        ? <FuerzaForm fuerza={fuerza} onCambio={setFuerza} ejercicios={ejercicios} sesiones={datos.sesiones.filter((x) => x.id !== sesionInicial?.id)} onQuitar={() => setFuerza(null)} />
        : <button type="button" class="boton" onClick={() => setFuerza(fuerzaInicial(ejercicioSugerido(datos.sesiones, ROTACION), datos.sesiones))}>＋ Fuerza</button>}
      {metcon
        ? <MetconForm metcon={metcon} onCambio={setMetcon} onQuitar={() => setMetcon(null)} />
        : <button type="button" class="boton" style="margin-left:8px" onClick={() => setMetcon({ formato: 'AMRAP', rx: true })}>＋ Metcon</button>}
      <textarea aria-label="Nota" placeholder="Nota (opcional)" style="margin-top:12px" value={nota} onInput={(e) => setNota((e.target as HTMLTextAreaElement).value)} />
      <div class="fila"><button type="button" class="primario" disabled={guardando || (!fuerza && !metcon)} onClick={guardar}>Guardar</button></div>
    </main>
  );
}
