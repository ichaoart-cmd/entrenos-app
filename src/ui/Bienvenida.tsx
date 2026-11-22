import type { Datos } from '../domain/types';

const CLAVE = 'bienvenida-vista';

/** Sale una sola vez, a quien entra sin datos ni token (un conocido probando la app). */
export function debeVerBienvenida(d: Datos, ajustes: { token?: string }): boolean {
  try { if (localStorage.getItem(CLAVE)) return false; } catch { return false; }
  return !ajustes.token && !d.sesiones.length && !d.carreras.length;
}

const esIOS = () => typeof navigator !== 'undefined' && /iPhone|iPad|iPod/.test(navigator.userAgent);

export function Bienvenida({ onCerrar }: { onCerrar: () => void }) {
  const ios = esIOS();
  const cerrar = () => { try { localStorage.setItem(CLAVE, '1'); } catch { /* sin almacenamiento */ } onCerrar(); };
  return (
    <div class='hoja bienvenida' role='dialog' aria-label='Bienvenida' aria-modal='true'>
      <div class='bienvenida-contenido'>
        <span class='beta'>Beta</span>
        <h1>¡Bienvenido al box!</h1>
        <p>Apunta tus pesos, Metcons y carreras en segundos, y mira cómo vas mejorando.</p>
        <section>
          <h2>Tus datos</h2>
          <p>Se guardan <b>solo en este móvil</b>. Nadie más los ve. Si cambias de móvil o borras los datos del navegador, se pierden: de vez en cuando haz una copia en <b>Ajustes → Exportar copia</b>.</p>
        </section>
        <section>
          <h2>Instálala</h2>
          {ios
            ? <p>En Safari, toca <b>Compartir</b> (el cuadrado con la flecha) → <b>Añadir a pantalla de inicio</b>.</p>
            : <p>En Chrome, toca el menú <b>⋮</b> → <b>Instalar aplicación</b> (o «Añadir a pantalla de inicio»).</p>}
          <p class='suave'>{ios ? '¿Android? En Chrome: menú ⋮ → Instalar aplicación.' : '¿iPhone? En Safari: Compartir → Añadir a pantalla de inicio.'}</p>
        </section>
        <section>
          <h2>Cuéntame qué tal</h2>
          <p>Está en pruebas. Cuando la hayas usado unos días, toca <b>Beta</b> arriba en el inicio y mándame tu opinión.</p>
        </section>
        <button type='button' class='primario' onClick={cerrar}>¡Vamos allá!</button>
      </div>
    </div>
  );
}
