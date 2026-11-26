/// <reference types="vite-plugin-pwa/client" />
import { registerSW } from 'virtual:pwa-register';

/**
 * Mantiene la app al día sin tener que reinstalarla.
 * El service worker busca versión nueva cada vez que la app vuelve a primer plano (y cada hora);
 * en modo autoUpdate, en cuanto la nueva toma el control, la página se recarga sola.
 * Los datos no se pierden: viven en IndexedDB y la cola de subida sigue ahí tras recargar.
 */
export function iniciarActualizaciones() {
  if (!('serviceWorker' in navigator)) return;
  registerSW({
    immediate: true,
    onRegisteredSW(_url, registro) {
      if (!registro) return;
      const comprobar = () => { if (navigator.onLine) void registro.update().catch(() => { /* sin red */ }); };
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') comprobar(); });
      setInterval(comprobar, 60 * 60 * 1000);
    },
  });
}
