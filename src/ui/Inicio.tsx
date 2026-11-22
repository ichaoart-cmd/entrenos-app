import { estado } from '../store/estado';
import { fechaLarga, resumenFuerza, resumenMetcon, textoSync } from './formato';
import { Calendario } from './Calendario';

export function Inicio() {
  const vivas = estado.datos.value.sesiones.filter((s) => !s.borrado);
  const ultima = vivas.reduce<typeof vivas[number] | null>((a, s) => (!a || s.fecha > a.fecha ? s : a), null);
  const error = estado.estadoSync.value === 'error';
  return (
    <main class="pagina">
      <h1>Entrenos</h1>
      <a class="boton-grande" href="#/registrar">＋ Registrar</a>
      <Calendario sesiones={vivas} minSemana={estado.ajustes.value.minSesionesSemana} />
      {ultima && (
        <a class="tarjeta ultima" href={`#/registrar?id=${encodeURIComponent(ultima.id)}`}>
          <div class="titulo">Última sesión, {fechaLarga(ultima.fecha)}</div>
          {ultima.fuerza.length > 0 && <div class="que">{resumenFuerza(ultima)}</div>}
          {ultima.metcon && <div>{resumenMetcon(ultima)}</div>}
        </a>
      )}
      <p class={`sync${error ? ' error' : ''}`}>{textoSync(estado.estadoSync.value, estado.ultimoResultado.value)}</p>
    </main>
  );
}
