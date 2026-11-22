import { estado } from '../store/estado';
import { ROTACION, ejercicioSugerido, ultimaFuerza } from '../domain/records';
import { fechaLarga, nombreEjercicio, resumenFuerza, resumenMetcon, textoSync } from './formato';
import { Calendario } from './Calendario';
import { IconoEjercicio, NOMBRE_CORTO } from './iconos';
import { ultimoTop } from './FuerzaForm';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const kg = (n: number) => String(n).replace('.', ',');

export function Inicio() {
  const vivas = estado.datos.value.sesiones.filter((s) => !s.borrado);
  const ultima = vivas.reduce<typeof vivas[number] | null>((a, s) => (!a || s.fecha > a.fecha ? s : a), null);
  const toca = ejercicioSugerido(vivas, ROTACION);
  const ultToca = ultimaFuerza(vivas, toca);
  const fechaToca = vivas.filter((s) => s.fuerza.some((f) => f.ejercicio === toca)).reduce((a, s) => (s.fecha > a ? s.fecha : a), '');
  const ahora = new Date();
  const error = estado.estadoSync.value === 'error';

  return (
    <main class='pagina'>
      <div class='fecha-hoy'>{DIAS[ahora.getDay()]}, {ahora.getDate()} de {MESES[ahora.getMonth()]}</div>
      <h1>Hola, ¿entrenamos?</h1>

      <section class='hero' aria-label='Hoy toca'>
        <div class='k'>Hoy toca, según tu rotación</div>
        <div class='ej'>{nombreEjercicio(toca)}</div>
        <div class='ult'>
          {ultToca?.series.length
            ? <>Última vez {ultToca.reps ?? '?'} × {kg(Math.max(...ultToca.series))} kg<br />{fechaLarga(fechaToca)}</>
            : 'Aún no lo has registrado'}
        </div>
        <span class='pictograma'><IconoEjercicio id={toca} size={92} /></span>
        <div class='acciones'>
          <a class='accion' href={`#/registrar?ej=${toca}`}>Registrar</a>
          <a class='accion secundaria' href='#/registrar?elegir=1'>Otro ejercicio</a>
        </div>
      </section>

      <h2>Tus ejercicios</h2>
      <div class='circulos'>
        {ROTACION.map((id) => {
          const t = ultimoTop(vivas, id);
          return (
            <a class='circulo' href={`#/registrar?ej=${id}`} aria-label={`${nombreEjercicio(id)}${t != null ? `, ${kg(t)} kg` : ''}`}>
              <span class='disco'><IconoEjercicio id={id} size={40} /></span>
              <span>{NOMBRE_CORTO[id]}</span>
              <span class='kg'>{t != null ? `${kg(t)} kg` : '—'}</span>
            </a>
          );
        })}
      </div>

      <h2>Constancia</h2>
      <Calendario sesiones={vivas} minSemana={estado.ajustes.value.minSesionesSemana} />

      {ultima && (
        <a class='tarjeta ultima' href={`#/registrar?id=${encodeURIComponent(ultima.id)}`}>
          <div class='titulo'>Última sesión, {fechaLarga(ultima.fecha)}</div>
          {ultima.fuerza.length > 0 && <div class='que'>{resumenFuerza(ultima)}</div>}
          {ultima.metcon && <div>{resumenMetcon(ultima)}</div>}
        </a>
      )}
      <p class={`sync${error ? ' error' : ''}`}>{textoSync(estado.estadoSync.value, estado.ultimoResultado.value)}</p>
    </main>
  );
}
