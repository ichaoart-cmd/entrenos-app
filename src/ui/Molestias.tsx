import { ZONAS, molestiasRecientes, textoMolestia, zonasQueCarga } from '../domain/molestias';
import { estado } from '../store/estado';
import { hoy } from './Registrar';

/** Botones para marcar zonas con molestia. */
export function SelectorMolestias({ valor, onCambio }: { valor: string[]; onCambio: (v: string[]) => void }) {
  return (
    <div class='molestias'>
      <div class='etiq'>¿Algo te duele? <small>(opcional)</small></div>
      <div class='molestias-zonas' role='group' aria-label='Molestias'>
        {ZONAS.map((z) => (
          <button type='button' class='chip' aria-pressed={valor.includes(z.id)}
            onClick={() => onCambio(valor.includes(z.id) ? valor.filter((x) => x !== z.id) : [...valor, z.id])}>{z.nombre}</button>
        ))}
      </div>
    </div>
  );
}

/** Aviso si el ejercicio carga una zona con molestia apuntada hace poco (sin contar la sesión que se edita). */
export function AvisoMolestia({ ejercicio, excluir }: { ejercicio: string; excluir?: string }) {
  const zonas = zonasQueCarga(ejercicio);
  const m = molestiasRecientes(estado.datos.value.sesiones, estado.datos.value.carreras, hoy(), excluir).filter((x) => zonas.includes(x.zona));
  if (!m.length) return null;
  const txt = m.map(textoMolestia).join(' y ');
  return <p class='aviso-molestia' role='note'>Ojo: hace poco te molestó {txt}. Calienta bien y baja peso si hace falta.</p>;
}
