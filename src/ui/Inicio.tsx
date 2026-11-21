import { estado } from '../store/estado';
import { fechaLarga, resumenFuerza, resumenMetcon, textoSync } from './formato';

export function Inicio() {
  const vivas = estado.datos.value.sesiones.filter((s) => !s.borrado);
  const ultima = vivas.reduce<typeof vivas[number] | null>((a, s) => (!a || s.fecha > a.fecha ? s : a), null);
  const error = estado.estadoSync.value === 'error';
  return (
    <main class="pagina">
      <h1>Entrenos</h1>
      <a class="boton-grande" href="#/registrar">＋ Registrar</a>
      {ultima && (
        <section class="tarjeta">
          <div class="suave">Última sesión · {fechaLarga(ultima.fecha)}</div>
          {ultima.fuerza.length > 0 && <div>{resumenFuerza(ultima)}</div>}
          {ultima.metcon && <div>{resumenMetcon(ultima)}</div>}
        </section>
      )}
      <p class={`sync${error ? ' error' : ''}`}>{textoSync(estado.estadoSync.value, estado.ultimoResultado.value)}</p>
    </main>
  );
}
