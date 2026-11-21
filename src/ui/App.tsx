import { useEffect, useState } from 'preact/hooks';
import { Registrar } from './Registrar';
import { Inicio } from './Inicio';
import { Historial } from './Historial';
import { Ajustes } from './Ajustes';
import { estado } from '../store/estado';

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

export function App() {
  const ruta = usarRuta();
  const [base, query = ''] = ruta.split('?');
  let pagina;
  if (base === '#/registrar') {
    const id = new URLSearchParams(query).get('id');
    const s = id ? estado.datos.value.sesiones.find((x) => x.id === id) : undefined;
    pagina = <Registrar key={`${ruta}-${s?.id ?? "nueva"}`} sesionInicial={s} />;
  } else if (base === '#/historial') pagina = <Historial />;
  else if (base === '#/ajustes') pagina = <Ajustes />;
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
