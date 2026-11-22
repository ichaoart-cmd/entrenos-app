import { estado } from '../store/estado';
import { BENCHMARKS, historialBenchmark, mejorBenchmark } from '../domain/benchmarks';
import { IconoEjercicio } from './iconos';
import { fechaLarga } from './formato';

const metcons = () => estado.datos.value.sesiones.filter((s) => !s.borrado && s.metcon);

export function TarjetaMetcon() {
  const n = metcons().length;
  const hechos = BENCHMARKS.filter((b) => mejorBenchmark(estado.datos.value.sesiones, b.id)).length;
  return (
    <a class='ejercicio-progreso enlace-ficha' href='#/progreso?ej=metcon' aria-label='Metcons'>
      <header>
        <span class='disco'><IconoEjercicio id='metcon' size={32} /></span>
        <div><h3>Metcons</h3><span class='suave' style='font-size:0.8rem'>{n} registrados</span></div>
        <div class='rm'><b>{hechos}</b><span>WODs de referencia</span></div>
      </header>
    </a>
  );
}

export function FichaMetcon() {
  const ses = estado.datos.value.sesiones;
  const hechos = BENCHMARKS.map((b) => ({ b, h: historialBenchmark(ses, b.id), mejor: mejorBenchmark(ses, b.id) })).filter((x) => x.h.length);
  const pendientes = BENCHMARKS.filter((b) => !hechos.some((x) => x.b.id === b.id));
  return (
    <main class='pagina'>
      <div class='cabecera-registro'>
        <a href='#/progreso' aria-label='Volver' class='volver'>←</a>
        <h1>Metcons</h1>
      </div>
      <p class='suave'>{metcons().length} Metcons registrados. Para comparar tus marcas, elige el WOD de referencia al registrarlo.</p>
      {hechos.length === 0 && <p class='suave'>Aún no has hecho ninguno de referencia (Fran, Cindy, Murph…).</p>}
      {hechos.map(({ b, h, mejor }) => (
        <section class='tarjeta wod' aria-label={b.nombre}>
          <header>
            <h2>{b.nombre}</h2>
            {mejor && <b class='mejor'>{mejor.valor}{mejor.rx ? ' RX' : ''}</b>}
          </header>
          <p class='suave'>{b.descripcion}</p>
          <ul>
            {[...h].reverse().map((x) => (
              <li class={x === mejor ? 'es-mejor' : undefined}>
                <span>{fechaLarga(x.fecha)}</span><b>{x.valor}</b><small>{x.rx ? 'RX' : 'Escalado'}{x === mejor ? ' · mejor' : ''}</small>
              </li>
            ))}
          </ul>
        </section>
      ))}
      {pendientes.length > 0 && <>
        <h2>Por probar</h2>
        <p class='suave'>{pendientes.map((b) => b.nombre).join(', ')}</p>
      </>}
    </main>
  );
}
