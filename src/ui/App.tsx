import { useEffect, useState } from 'preact/hooks';
import { Registrar } from './Registrar';
import { Inicio } from './Inicio';
import { Historial } from './Historial';
import { Ajustes } from './Ajustes';
import { estado } from '../store/estado';
import { Progreso } from './Progreso';
import { IconoNav } from './iconos';

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
    const q = new URLSearchParams(query);
    const id = q.get('id');
    const fecha = q.get('fecha');
    const ej = q.get('ej');
    const s = id ? estado.datos.value.sesiones.find((x) => x.id === id) : undefined;
    pagina = <Registrar key={`${ruta}-${s?.id ?? 'nueva'}`} sesionInicial={s} fechaInicial={fecha && /^\d{4}-\d{2}-\d{2}$/.test(fecha) ? fecha : undefined} ejercicioInicial={ej ?? undefined} />;
  } else if (base === '#/historial') pagina = <Historial />;
  else if (base === '#/ajustes') pagina = <Ajustes />;
  else if (base === '#/progreso') pagina = <Progreso key={query} ejercicio={new URLSearchParams(query).get('ej') ?? undefined} />;
  else pagina = <Inicio />;
  return (
    <>
      {pagina}
      <nav class="barra">
        {([['#/', 'inicio', 'Inicio'], ['#/historial', 'historial', 'Historial'], ['#/progreso', 'progreso', 'Progreso'], ['#/ajustes', 'ajustes', 'Ajustes']] as const).map(([href, icono, texto]) => (
          <a href={href} aria-current={base === href || (href === '#/' && base === '#/registrar') ? 'page' : undefined}>
            <IconoNav id={icono} />{texto}
          </a>
        ))}
      </nav>
    </>
  );
}
