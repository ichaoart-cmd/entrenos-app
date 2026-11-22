/** Navegación con «atrás» jerárquico: las pantallas del menú cuelgan del inicio, y las subpantallas
 * (registrar, carrera, fichas de progreso) de la pantalla del menú desde la que se abren. Así el botón
 * atrás del móvil o del navegador sube un nivel en vez de deshacer todo el recorrido. */
const MENU = new Set(['#/', '#/historial', '#/progreso', '#/ajustes']);
const esMenu = (r: string) => MENU.has(r);

/** Pila de pantallas que debe quedar al ir a `dest` estando en `actual`. */
export function pilaDestino(actual: string[], dest: string): string[] {
  if (dest === '#/') return ['#/'];
  if (esMenu(dest)) return ['#/', dest];
  if (dest.startsWith('#/progreso?')) return ['#/', '#/progreso', dest];
  let i = actual.length - 1;
  while (i > 0 && !esMenu(actual[i])) i--;
  return [...actual.slice(0, i + 1), dest];
}

/** Cuántas pantallas retroceder y cuáles apilar después para pasar de una pila a otra. */
export function pasos(actual: string[], destino: string[]) {
  let k = 0;
  while (k < actual.length && k < destino.length && actual[k] === destino[k]) k++;
  return { atras: actual.length - k, apilar: destino.slice(k) };
}

let pila: string[] = ['#/'];
const hashActual = () => (typeof location === 'undefined' || !location.hash ? '#/' : location.hash);
const avisar = () => dispatchEvent(new Event('ruta'));

function retroceder(n: number): Promise<void> {
  return new Promise((res) => {
    addEventListener('popstate', () => res(), { once: true });
    history.go(-n);
  });
}

/** Ir a una pantalla respetando la jerarquía. */
export async function navegar(dest: string): Promise<void> {
  const destino = pilaDestino(pila, dest);
  const { atras, apilar } = pasos(pila, destino);
  if (atras) await retroceder(atras);
  const base = destino.length - apilar.length;
  apilar.forEach((r, i) => history.pushState({ pila: destino.slice(0, base + i + 1) }, '', r));
  pila = destino;
  avisar();
}

export function iniciarNavegacion(): void {
  const estado = history.state as { pila?: string[] } | null;
  if (estado?.pila?.length) pila = estado.pila;
  else {
    // Primera carga (o enlace directo): se construye la cadena hasta aquí para que «atrás» suba de nivel.
    pila = pilaDestino(['#/'], hashActual());
    history.replaceState({ pila: pila.slice(0, 1) }, '', pila[0]);
    for (let i = 1; i < pila.length; i++) history.pushState({ pila: pila.slice(0, i + 1) }, '', pila[i]);
  }
  addEventListener('popstate', (e) => {
    pila = (e.state as { pila?: string[] } | null)?.pila ?? pilaDestino(['#/'], hashActual());
    avisar();
  });
  // Si alguien cambia la dirección a mano, se recoloca en la jerarquía.
  addEventListener('hashchange', () => {
    if (hashActual() === pila[pila.length - 1]) return;
    pila = pilaDestino(pila, hashActual());
    history.replaceState({ pila }, '', hashActual());
  });
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = (e.target as Element | null)?.closest?.('a[href^="#/"]');
    if (!a) return;
    e.preventDefault();
    void navegar(a.getAttribute('href')!);
  });
}
