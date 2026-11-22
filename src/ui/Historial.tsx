import { useState } from 'preact/hooks';
import { borrar, estado } from '../store/estado';
import { fechaLarga, resumenFuerza, resumenMetcon } from './formato';
import { IconoEjercicio } from './iconos';

export function Historial() {
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const sesiones = estado.datos.value.sesiones
    .filter((s) => !s.borrado)
    .sort((a, b) => (a.fecha === b.fecha ? b.actualizado.localeCompare(a.actualizado) : b.fecha.localeCompare(a.fecha)));
  return (
    <main class="pagina">
      <h1>Historial</h1>
      {sesiones.length === 0 && <p class="suave">Aún no hay sesiones.</p>}
      <ul class="lista">
        {sesiones.map((s) => (
          <li key={s.id}>
            <span class="disco"><IconoEjercicio id={s.fuerza[0]?.ejercicio ?? 'snatch'} size={30} /></span>
            <div class="cuerpo"><a href={`#/registrar?id=${encodeURIComponent(s.id)}`}>
              <div class="suave">{fechaLarga(s.fecha)}{s.lugar === 'casa' ? ', en casa' : ''}</div>
              {s.fuerza.length > 0 && <div>{resumenFuerza(s)}</div>}
              {s.metcon && <div>{resumenMetcon(s)}</div>}
            </a>
            {confirmar === s.id ? (
              <div class="fila">
                <button type="button" class="peligro" onClick={() => { setConfirmar(null); void borrar(s.id); }}>Sí, borrar</button>
                <button type="button" onClick={() => setConfirmar(null)}>Cancelar</button>
              </div>
            ) : (
              <div class="fila"><button type="button" onClick={() => setConfirmar(s.id)}>Borrar</button></div>
            )}</div>
          </li>
        ))}
      </ul>
    </main>
  );
}
