import { useEffect, useState } from 'preact/hooks';
import { estado, sincronizarAhora } from '../store/estado';
import { cargarAjustes, guardarAjustes } from '../store/local';
import { exportarCSV, exportarJSON } from '../domain/exportar';
import { textoSync } from './formato';
import { hoy } from './Registrar';

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
      <section class="tarjeta">
        <h2>Sincronización con GitHub</h2>
        <p class="suave">
          Crea un token en GitHub → Settings → Developer settings → <b>Fine-grained tokens</b>, con acceso
          solo al repositorio <b>entrenos-data</b> y permiso <b>Contents: Read and write</b>.
        </p>
        <input type="password" aria-label="Token de GitHub" placeholder="github_pat_…" style="width:100%"
          value={token} onInput={(e) => setToken((e.target as HTMLInputElement).value.trim())} />
        <div class="fila">
          <button type="button" onClick={async () => { await guardarAjustes({ token }); estado.ajustes.value = await cargarAjustes(); setMensaje('Token guardado'); }}>Guardar token</button>
          <button type="button" disabled={ocupado} onClick={sync}>Sincronizar ahora</button>
        </div>
        {mensaje && <p class="sync" role="status">{mensaje}</p>}
        {estado.ajustes.value.ultimaSync && <p class="suave">Última sincronización: {new Date(estado.ajustes.value.ultimaSync).toLocaleString('es-ES')}</p>}
      </section>
      <section class="tarjeta">
        <h2>Copia de seguridad</h2>
        <div class="fila">
          <button type="button" onClick={() => descargar(`entrenos-${hoy()}.json`, exportarJSON(estado.datos.value), 'application/json')}>Exportar JSON</button>
          <button type="button" onClick={() => descargar(`entrenos-${hoy()}.csv`, exportarCSV(estado.datos.value), 'text/csv')}>Exportar CSV</button>
        </div>
      </section>
    </main>
  );
}
