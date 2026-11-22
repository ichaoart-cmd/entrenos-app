import { useState } from 'preact/hooks';
import { borrar, estado, quitarCarrera } from '../store/estado';
import type { Carrera, Sesion } from '../domain/types';
import { fechaLarga, resumenCarrera, resumenFuerza, resumenMetcon } from './formato';
import { IconoEjercicio } from './iconos';

type Item = { tipo: 'sesion'; x: Sesion } | { tipo: 'carrera'; x: Carrera };

export function Historial() {
  const [confirmar, setConfirmar] = useState<string | null>(null);
  const d = estado.datos.value;
  const items: Item[] = [
    ...d.sesiones.filter((s) => !s.borrado).map((x) => ({ tipo: 'sesion' as const, x })),
    ...d.carreras.filter((c) => !c.borrado).map((x) => ({ tipo: 'carrera' as const, x })),
  ].sort((a, b) => (a.x.fecha === b.x.fecha ? b.x.actualizado.localeCompare(a.x.actualizado) : b.x.fecha.localeCompare(a.x.fecha)));
  return (
    <main class="pagina">
      <h1>Historial</h1>
      {items.length === 0 && <p class="suave">Aún no hay entrenos.</p>}
      <ul class="lista">
        {items.map((it) => {
          const id = it.x.id;
          const esCarrera = it.tipo === 'carrera';
          const href = esCarrera ? `#/carrera?id=${encodeURIComponent(id)}` : `#/registrar?id=${encodeURIComponent(id)}`;
          return (
            <li key={`${it.tipo}-${id}`}>
              <span class="disco"><IconoEjercicio id={esCarrera ? 'correr' : (it.x as Sesion).fuerza[0]?.ejercicio ?? 'metcon'} size={30} /></span>
              <div class="cuerpo"><a href={href}>
                {it.tipo === 'carrera' ? (
                  <>
                    <div class="suave">{fechaLarga(it.x.fecha)}{it.x.stravaId != null ? ', de Strava' : ''}</div>
                    <div>{resumenCarrera(it.x)}</div>
                  </>
                ) : (
                  <>
                    <div class="suave">{fechaLarga(it.x.fecha)}{it.x.lugar === 'casa' ? ', en casa' : ''}</div>
                    {it.x.fuerza.length > 0 && <div>{resumenFuerza(it.x)}</div>}
                    {it.x.metcon && <div>{resumenMetcon(it.x)}</div>}
                  </>
                )}
              </a>
              {confirmar === id ? (
                <div class="fila">
                  <button type="button" class="peligro" onClick={() => { setConfirmar(null); void (esCarrera ? quitarCarrera(id) : borrar(id)); }}>Sí, borrar</button>
                  <button type="button" onClick={() => setConfirmar(null)}>Cancelar</button>
                </div>
              ) : (
                <div class="fila"><button type="button" onClick={() => setConfirmar(id)}>Borrar</button></div>
              )}</div>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
