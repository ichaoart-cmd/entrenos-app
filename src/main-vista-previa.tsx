/**
 * Vista previa para el artefacto de Claude: sin PWA ni sincronización (el visor bloquea service workers y
 * peticiones a GitHub). Carga los datos de data/entrenos.json la primera vez y muestra un aviso fijo.
 * Solo se construye con `npm run build:vista-previa`; la app publicada no incluye este archivo.
 */
import datos from '../data/entrenos.json';
import { cargarLocal, reemplazarDatos } from './store/local';
import type { Datos } from './domain/types';

async function arrancar() {
  // Recarga los datos cuando cambia la copia incluida (p. ej. tras corregir erratas), o si no hay nada guardado.
  const huella = (datos as Datos).sesiones.reduce((a, x) => (x.actualizado > a ? x.actualizado : a), '') + (datos as Datos).sesiones.length;
  try {
    const local = await cargarLocal();
    let previa: string | null = null;
    try { previa = localStorage.getItem('vista-previa-datos'); } catch { /* sin localStorage */ }
    if (!local.sesiones.length || previa !== huella) {
      await reemplazarDatos(datos as Datos);
      try { localStorage.setItem('vista-previa-datos', huella); } catch { /* sin localStorage */ }
    }
  } catch { /* sin almacenamiento: la app arranca vacía */ }
  const aviso = document.createElement('div');
  aviso.textContent = 'Vista previa: lo que registres aquí no se guarda en GitHub.';
  aviso.style.cssText = 'position:sticky;top:0;z-index:20;background:#a57c45;color:#f8f4ec;font:600 13px system-ui;padding:8px 12px;text-align:center';
  document.body.prepend(aviso);
  await import('./main');
}
void arrancar();
