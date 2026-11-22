import { estado } from '../store/estado';
import { ejerciciosHabituales, entrenoDeHoy, retoSemanal } from '../domain/inicio';
import { MOVIMIENTOS } from '../domain/benchmarks';
import { fechaLarga, nombreEjercicio, resumenCarrera, resumenFuerza, resumenMetcon, textoSync } from './formato';
import { Calendario } from './Calendario';
import { IconoEjercicio, NOMBRE_CORTO } from './iconos';
import { generarAvisos } from '../domain/avisos';
import { hoy } from './Registrar';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const kg = (n: number) => String(n).replace('.', ',');

export function Inicio() {
  const vivas = estado.datos.value.sesiones.filter((s) => !s.borrado);
  const ultima = vivas.reduce<typeof vivas[number] | null>((a, s) => (!a || s.fecha > a.fecha ? s : a), null);
  const h = hoy();
  const habituales = ejerciciosHabituales(vivas, h, 4);
  const masTiempo = habituales.reduce<typeof habituales[number] | null>((a, x) => (x.dias != null && x.dias >= 7 && (!a || x.dias > (a.dias ?? 0)) ? x : a), null);
  const deHoy = entrenoDeHoy(vivas, estado.datos.value.carreras, h);
  const reto = retoSemanal(vivas, h);
  const ahora = new Date();
  const error = estado.estadoSync.value === 'error';

  return (
    <main class='pagina'>
      <div class='fecha-hoy'>{DIAS[ahora.getDay()]}, {ahora.getDate()} de {MESES[ahora.getMonth()]}</div>
      <h1>¿Hoy qué cae?</h1>

      {deHoy.vacio ? (
        <section class='hero hero-elegir' aria-label='¿A qué le damos caña?'>
          <h2 class='hero-titulo'>¿A qué le damos caña?</h2>
          <div class='hero-ejercicios'>
            {habituales.map((x) => (
              <a class={`hero-ej${x === masTiempo ? ' hace-tiempo' : ''}`} href={`#/registrar?ej=${x.id}`}
                aria-label={`${nombreEjercicio(x.id)}${x.top != null ? `, ${kg(x.top)} kg` : ''}${x.dias != null ? `, hace ${x.dias} días` : ''}`}>
                <span class='disco'><IconoEjercicio id={x.id} size={52} /></span>
                <b>{NOMBRE_CORTO[x.id] ?? nombreEjercicio(x.id)}</b>
                <small>{x.top != null ? `${kg(x.top)} kg` : 'nuevo'}{x.dias != null && <><br />{x.dias === 0 ? 'hoy' : `hace ${x.dias} d`}</>}</small>
                {x === masTiempo && <i class='etiqueta-hace'>Abandonado</i>}
              </a>
            ))}
          </div>
          <div class='hero-otros'>
            <a class='accion' href='#/registrar?metcon=1'>Metcon</a>
            <a class='accion' href='#/carrera'>Carrera</a>
            <a class='accion secundaria' href='#/registrar?elegir=1'>Otro ejercicio</a>
          </div>
        </section>
      ) : (
        <section class='hero hero-hecho' aria-label='Hoy ya has cumplido'>
          <h2 class='hero-titulo'>Hoy ya has cumplido{deHoy.record ? ' ★' : ''}</h2>
          <ul>
            {deHoy.sesiones.map((s) => <li><a href={`#/registrar?id=${encodeURIComponent(s.id)}`}>
              {s.fuerza.length > 0 && <span>{resumenFuerza(s)}</span>}{s.metcon && <span>{resumenMetcon(s)}</span>}</a></li>)}
            {deHoy.carreras.map((c) => <li><a href={`#/carrera?id=${encodeURIComponent(c.id)}`}><span>{resumenCarrera(c)}</span></a></li>)}
          </ul>
          {deHoy.record && <p class='hero-record'>¡Hoy ha caído un PR!</p>}
          <div class='hero-otros'>
            <a class='accion' href='#/registrar?elegir=1'>Meter algo más</a>
            <a class='accion secundaria' href='#/carrera'>Carrera</a>
          </div>
        </section>
      )}

      <section class='tarjeta reto' aria-label='El reto de la semana'>
        <span class='disco'><img class='ilustracion' alt='' width={44} height={44}
          src={`${import.meta.env.BASE_URL}ilustraciones/${MOVIMIENTOS.find((m) => m.id === reto.benchmark.movimientos[0])?.ilustracion ?? 'wall-ball'}.webp`} /></span>
        <div>
          <div class='k'>El reto de la semana</div>
          <b>{reto.benchmark.nombre}</b>
          <small>{reto.mejor ? `Tu marca: ${reto.mejor.valor}${reto.diasDesde != null ? `, hace ${reto.diasDesde > 60 ? `${Math.round(reto.diasDesde / 30)} meses` : `${reto.diasDesde} días`}` : ''}. ¿Le das la revancha?` : `${reto.benchmark.descripcion}. Aún no te has atrevido.`}</small>
        </div>
        <a class='accion' href={`#/registrar?wod=${reto.benchmark.id}`} aria-label={`Hacer ${reto.benchmark.nombre}`}>Al lío</a>
      </section>

      <h2>Tu constancia</h2>
      <Calendario sesiones={vivas} carreras={estado.datos.value.carreras} minSemana={estado.ajustes.value.minSesionesSemana} />

      <h2>Lo que se cuece</h2>
      <ul class='destacado'>
        {generarAvisos(estado.datos.value, hoy(), estado.ajustes.value.minSesionesSemana).map((a) => {
          const cuerpo = <>
            <span class='marca' aria-hidden='true'>{a.tipo === 'logro' ? '★' : a.tipo === 'alerta' ? '!' : '✓'}</span>
            <span><b>{a.titulo}</b>{a.texto && <small>{a.texto}</small>}</span>
          </>;
          return <li class={a.tipo}>{a.href ? <a href={a.href}>{cuerpo}</a> : <div>{cuerpo}</div>}</li>;
        })}
      </ul>

      {ultima && (
        <a class='tarjeta ultima' href={`#/registrar?id=${encodeURIComponent(ultima.id)}`}>
          <div class='titulo'>Lo último, {fechaLarga(ultima.fecha)}</div>
          {ultima.fuerza.length > 0 && <div class='que'>{resumenFuerza(ultima)}</div>}
          {ultima.metcon && <div>{resumenMetcon(ultima)}</div>}
        </a>
      )}
      <p class={`sync${error ? ' error' : ''}`}>{textoSync(estado.estadoSync.value, estado.ultimoResultado.value)}</p>
    </main>
  );
}
