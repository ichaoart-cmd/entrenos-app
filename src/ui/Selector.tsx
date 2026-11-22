import { useEffect, useRef, useState } from 'preact/hooks';
import { GRUPOS, buscarEjercicios } from '../domain/catalogo';
import { IconoEjercicio } from './iconos';

/** Hoja a pantalla completa para elegir cualquier ejercicio del catálogo, con buscador. */
export function Selector({ onElegir, onCerrar }: { onElegir: (id: string) => void; onCerrar: () => void }) {
  const [q, setQ] = useState('');
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  const res = buscarEjercicios(q);
  return (
    <div class='hoja' role='dialog' aria-label='Elegir ejercicio'>
      <div class='hoja-cabecera'>
        <h2>Ejercicios</h2>
        <button type='button' onClick={onCerrar}>Cerrar</button>
      </div>
      <input ref={ref} type='search' aria-label='Buscar ejercicio' placeholder='Buscar: thruster, militar, arrancada…'
        value={q} onInput={(e) => setQ((e.target as HTMLInputElement).value)} />
      <div class='hoja-lista'>
        {GRUPOS.map((g) => {
          const items = res.filter((e) => e.grupo === g);
          if (!items.length) return null;
          return (
            <section>
              <div class='etiq'>{g}</div>
              {items.map((e) => (
                <button type='button' class='hoja-item' aria-label={e.nombre} onClick={() => onElegir(e.id)}>
                  <span class='disco'><IconoEjercicio id={e.id} size={30} /></span>{e.nombre}
                </button>
              ))}
            </section>
          );
        })}
        {!res.length && <p class='suave'>No hay ningún ejercicio con «{q}». Prueba con otro nombre.</p>}
      </div>
    </div>
  );
}
