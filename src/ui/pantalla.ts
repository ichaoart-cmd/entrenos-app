import { useEffect } from 'preact/hooks';

type Bloqueo = { release: () => Promise<void> };

/** Mantiene la pantalla encendida mientras `activo` (Wake Lock). Si el navegador no lo soporta, no hace nada. */
export function usarPantallaEncendida(activo = true): void {
  useEffect(() => {
    if (!activo) return;
    const wl = (navigator as unknown as { wakeLock?: { request: (t: 'screen') => Promise<Bloqueo> } }).wakeLock;
    if (!wl) return;
    let bloqueo: Bloqueo | null = null, vivo = true;
    const pedir = () => { if (document.visibilityState === 'visible') wl.request('screen').then((b) => { if (vivo) bloqueo = b; else void b.release(); }).catch(() => {}); };
    pedir();
    // El sistema suelta el bloqueo al salir de la app; se vuelve a pedir al volver.
    document.addEventListener('visibilitychange', pedir);
    return () => { vivo = false; document.removeEventListener('visibilitychange', pedir); void bloqueo?.release().catch(() => {}); };
  }, [activo]);
}
