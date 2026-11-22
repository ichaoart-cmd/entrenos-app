import { useEffect, useState } from 'preact/hooks';
import { estado, importar, sincronizarAhora } from '../store/estado';
import { cargarAjustes, guardarAjustes } from '../store/local';
import { exportarCSV, exportarJSON } from '../domain/exportar';
import { textoSync } from './formato';
import { hoy } from './Registrar';
import { activarSonido, sonidoActivo } from './sonido';
import { POOLS, delDia } from './frases';

function descargar(nombre: string, contenido: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([contenido], { type: tipo }));
  const a = document.createElement('a');
  a.href = url; a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Ajustes() {
  const [token, setToken] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const [sonido, setSonido] = useState(sonidoActivo());
  const [mensajeDatos, setMensajeDatos] = useState<string | null>(null);
  useEffect(() => { void cargarAjustes().then((a) => setToken(a.token ?? '')); }, []);

  const sync = async () => {
    setOcupado(true);
    const r = await sincronizarAhora();
    setMensaje(textoSync(estado.estadoSync.value, r));
    setOcupado(false);
  };

  return (
    <main class="pagina">
      <h1>Ajustes</h1>
      <p class="subtitulo">{delDia('subAjustes', POOLS.subAjustes)}</p>
      <section class="tarjeta">
        <h2>Al usar la app</h2>
        <div class="fila">
          <span class="etiqueta">Sonido y vibración al pulsar</span>
          <button type="button" role="switch" class="interruptor" aria-checked={sonido} aria-label="Sonido y vibración al pulsar"
            onClick={() => { activarSonido(!sonido); setSonido(!sonido); }}><span class="pista" /></button>
        </div>
        <p class="suave">El aviso de fin de descanso suena y vibra siempre.</p>
      </section>
      <section class="tarjeta">
        <h2>Tus datos</h2>
        <p class="suave">{estado.ajustes.value.token ? 'Se guardan en este móvil y se suben a tu GitHub.' : 'Se guardan solo en este móvil. Haz una copia de vez en cuando: si cambias de móvil, la importas y listo.'}</p>
        <div class="fila">
          <button type="button" onClick={() => descargar(`entrenos-${hoy()}.json`, exportarJSON(estado.datos.value), 'application/json')}>Exportar copia</button>
          <label class="boton importar">Importar copia
            <input type="file" accept="application/json,.json" aria-label="Importar copia" hidden
              onChange={async (e) => {
                const f = (e.target as HTMLInputElement).files?.[0]; if (!f) return;
                try { const n = await importar(await f.text()); setMensajeDatos(n > 0 ? `Importados ${n} entrenos nuevos ✓` : 'Copia importada: no había nada nuevo'); }
                catch (err) { setMensajeDatos((err as Error).message); }
                (e.target as HTMLInputElement).value = '';
              }} />
          </label>
          <button type="button" onClick={() => descargar(`entrenos-${hoy()}.csv`, exportarCSV(estado.datos.value), 'text/csv')}>Exportar a Excel (CSV)</button>
        </div>
        {mensajeDatos && <p class="sync" role="status">{mensajeDatos}</p>}
      </section>
      <details class="tarjeta avanzado" open={!!estado.ajustes.value.token}>
        <summary>Sincronizar con GitHub (avanzado)</summary>
        <p class="suave">
          Crea un token en GitHub → Settings → Developer settings → <b>Fine-grained tokens</b>, con acceso
          solo al repositorio <b>entrenos-data</b> y permiso <b>Contents: Read and write</b>.
        </p>
        <input type="password" aria-label="Token de GitHub" placeholder="github_pat_…" style="width:100%"
          value={token} onInput={(e) => setToken((e.target as HTMLInputElement).value.trim())} />
        <div class="fila">
          <button type="button" onClick={async () => { await guardarAjustes({ token }); estado.ajustes.value = await cargarAjustes(); setMensaje('Token guardado'); void sync(); }}>Guardar token</button>
          <button type="button" disabled={ocupado} onClick={sync}>Sincronizar ahora</button>
        </div>
        {mensaje && <p class="sync" role="status">{mensaje}</p>}
        {estado.ajustes.value.ultimaSync && <p class="suave">Última sincronización: {new Date(estado.ajustes.value.ultimaSync).toLocaleString('es-ES')}</p>}
      </details>
      <section class="tarjeta">
        <h2>¿Qué te parece la app?</h2>
        <p class="suave">Está en pruebas. Tu opinión manda.</p>
        <div class="fila"><a class="accion" href="#/opinion">Dar mi opinión</a></div>
      </section>
    </main>
  );
}
