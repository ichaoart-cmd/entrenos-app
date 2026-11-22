import { estado } from '../store/estado';
import { colorTipo, nombreTipo, repartoPorTipo } from '../domain/tipos';
import { hoy } from './Registrar';

const miles = (n: number) => n.toLocaleString('es-ES');

/** Barras por tipo de entreno: días de las últimas 4 semanas, con kg o km al lado. */
export function Reparto() {
  const r = repartoPorTipo(estado.datos.value.sesiones, estado.datos.value.carreras, hoy(), 4);
  const max = Math.max(1, ...r.map((x) => x.dias));
  return (
    <section class='tarjeta reparto' aria-label='Últimas 4 semanas'>
      <h3>Últimas 4 semanas</h3>
      <p class='suave'>Días de cada tipo, para ver si vas compensado.</p>
      {r.map((x) => (
        <div class='reparto-fila'>
          <span class='nombre'>{nombreTipo(x.tipo)}</span>
          <span class='pista'><i style={{ width: `${(x.dias / max) * 100}%`, background: colorTipo(x.tipo) }} /></span>
          <span class='dato'><b>{x.dias} {x.dias === 1 ? 'día' : 'días'}</b>
            <small>{x.km != null ? `${String(x.km).replace('.', ',')} km` : x.kg != null ? `${miles(x.kg)} kg` : ''}</small></span>
        </div>
      ))}
    </section>
  );
}
