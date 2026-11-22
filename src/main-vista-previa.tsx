/**
 * Vista previa para el artefacto de Claude: sin PWA ni sincronización (el visor bloquea service workers y
 * peticiones a GitHub). Carga los datos de data/entrenos.json la primera vez y muestra un aviso fijo.
 * Solo se construye con `npm run build:vista-previa`; la app publicada no incluye este archivo.
 */
import datos from '../data/entrenos.json';
import { cargarLocal, reemplazarDatos } from './store/local';
import type { Datos } from './domain/types';

async function arrancar() {
  try {
    const local = await cargarLocal();
    if (!local.sesiones.length) await reemplazarDatos(datos as Datos);
  } catch { /* sin almacenamiento: la app arranca vacía */ }
  const aviso = document.createElement('div');
  aviso.textContent = 'Vista previa: lo que registres aquí no se guarda en GitHub.';
  aviso.style.cssText = 'position:sticky;top:0;z-index:20;background:#a57c45;color:#f8f4ec;font:600 13px system-ui;padding:8px 12px;text-align:center';
  document.body.prepend(aviso);
  await import('./main');
}
void arrancar();
