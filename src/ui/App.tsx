import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Registrar } from './Registrar';

export type Ruta = '#/' | '#/registrar' | '#/historial' | '#/ajustes';

function rutaActual(): string {
  return typeof location === 'undefined' || !location.hash ? '#/' : location.hash;
}

export function usarRuta(): string {
  const [ruta, setRuta] = useState(rutaActual());
  useEffect(() => {
    const f = () => setRuta(rutaActual());
    addEventListener('hashchange', f);
    return () => removeEventListener('hashchange', f);
  }, []);
  return ruta;
}

function Inicio() {
  return (
    <main class="pagina">
      <a class="boton-grande" href="#/registrar">＋ Registrar</a>
    </main>
  );
}

function Pagina({ titulo }: { titulo: string; children?: ComponentChildren }) {
  return <main class="pagina"><h1>{titulo}</h1></main>;
}

export function App() {
  const ruta = usarRuta();
  const base = ruta.split('?')[0];
  let pagina;
  if (base === '#/registrar') pagina = <Registrar />;
  else if (base === '#/historial') pagina = <Pagina titulo="Historial" />;
  else if (base === '#/ajustes') pagina = <Pagina titulo="Ajustes" />;
  else pagina = <Inicio />;
  return (
    <>
      {pagina}
      <nav class="barra">
        <a href="#/">Inicio</a>
        <a href="#/historial">Historial</a>
        <a href="#/ajustes">Ajustes</a>
      </nav>
    </>
  );
}
