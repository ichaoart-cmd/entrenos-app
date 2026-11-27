import { useState } from 'preact/hooks';
import { estado } from '../store/estado';
import { ROTACION, recordsPorReps } from '../domain/records';
import { rmEstimado } from '../domain/rm';
import { filtrarPorTempo, serieProgreso, temposUsados, textoTempo, type FiltroTempo } from '../domain/progreso';
import { FichaCarrera, TarjetaCarrera } from './ProgresoCarrera';
import { FichaMetcon, TarjetaMetcon } from './ProgresoMetcon';
import { FichaPeso, TarjetaPeso } from './PesoCorporal';
import { Reparto } from './Reparto';
import { TarjetaLogros } from './Logros';
import { TarjetaResumen } from './Resumen';
import { POOLS, delDia } from './frases';
import { fuerzaRelativa, mejor1RM, pesoEn } from '../domain/peso';
import { CATALOGO, entrada } from '../domain/catalogo';
import { fechaLarga } from './formato';
import { IconoEjercicio } from './iconos';
import { Grafica } from './Grafica';
import { Chips } from './componentes/Chips';
import { conBarra } from '../domain/discos';

const kg = (n: number) => String(Math.round(n * 2) / 2).replace('.', ',');
type Periodo = '6m' | '1a' | 'todo';

export function Progreso({ ejercicio }: { ejercicio?: string }) {
  if (ejercicio === 'carrera') return <FichaCarrera />;
  if (ejercicio === 'peso') return <FichaPeso />;
  if (ejercicio === 'metcon') return <FichaMetcon />;
  return ejercicio ? <Ficha id={ejercicio} /> : <Lista />;
}

function Lista() {
  const sesiones = estado.datos.value.sesiones;
  const orden = [...CATALOGO].sort((a, b) => {
    const ia = ROTACION.indexOf(a.id), ib = ROTACION.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const filas = orden.map((e) => ({ e, n: serieProgreso(sesiones, e.id).length, rm: mejor1RM(sesiones, e.id) })).filter((f) => f.n);
  return (
    <main class='pagina'>
      <h1>Progreso</h1>
      <p class='subtitulo'>{delDia('subProgreso', POOLS.subProgreso)}</p>
      <TarjetaResumen />
      <TarjetaLogros />
      <Reparto />
      <TarjetaCarrera />
      <TarjetaMetcon />
      <TarjetaPeso />
      {filas.length === 0 && <p class='suave'>Registra tu primera sesión de fuerza para ver aquí tus marcas.</p>}
      {filas.map(({ e, n, rm }) => (
        <a class='ejercicio-progreso enlace-ficha' href={`#/progreso?ej=${e.id}`} aria-label={e.nombre}>
          <header>
            <span class='disco'><IconoEjercicio id={e.id} size={32} /></span>
            <div><h3>{e.nombre}</h3><span class='suave' style='font-size:0.8rem'>{n} {n === 1 ? 'sesión' : 'sesiones'}</span></div>
            {rm != null && <div class='rm'><b>{Math.round(rm)} kg</b><span>1RM estimado</span></div>}
          </header>
        </a>
      ))}
    </main>
  );
}

function Ficha({ id }: { id: string }) {
  const [periodo, setPeriodo] = useState<Periodo>('1a');
  const [tabla, setTabla] = useState(false);
  const [tempo, setTempo] = useState<FiltroTempo>('todas');
  const peso = pesoEn(estado.datos.value.pesos ?? [], new Date().toISOString().slice(0, 10));
  const todas = estado.datos.value.sesiones;
  const sesiones = filtrarPorTempo(todas, id, tempo);
  const tempos = temposUsados(todas, id);
  const haySin = serieProgreso(filtrarPorTempo(todas, id, 'sin'), id).length > 0;
  const opcionesTempo = [{ valor: 'todas', texto: 'Todas' }, ...(haySin ? [{ valor: 'sin', texto: 'Sin tempo' }] : []),
    ...(tempos.length > 1 ? [{ valor: 'con', texto: 'Con tempo' }] : []), ...tempos.map((t) => ({ valor: t, texto: textoTempo(t) }))];
  const sufijoTempo = tempo === 'todas' ? '' : tempo === 'sin' ? ' sin tempo' : tempo === 'con' ? ' con tempo' : ` a ${textoTempo(tempo)}`;
  const nombre = entrada(id)?.nombre ?? id;
  const todos = serieProgreso(sesiones, id);
  const corte = periodo === 'todo' ? '' : new Date(Date.now() - (periodo === '6m' ? 183 : 365) * 864e5).toISOString().slice(0, 10);
  const puntos = todos.filter((p) => p.fecha >= corte);
  const records = [...recordsPorReps(sesiones, id).values()].sort((a, b) => a.reps - b.reps);
  const rm = mejor1RM(sesiones, id);

  return (
    <main class='pagina'>
      <div class='cabecera-registro'>
        <a href='#/progreso' aria-label='Volver' class='volver'>←</a>
        <h1>{nombre}</h1>
      </div>
      {rm != null && (
        <div class='tarjeta resumen-rm'>
          <div><b>{Math.round(rm)} kg</b><span>1RM estimado{sufijoTempo}</span>
            {peso != null && <span class='relativa'>{String(fuerzaRelativa(rm, peso)).replace('.', ',')} × tu peso</span>}</div>
          <div class='estimados'>
            {[3, 5, 8, 10].map((r) => <span><small>{r}RM</small>{kg(rmEstimado(rm, r))}</span>)}
          </div>
        </div>
      )}
      {tempos.length > 0 && (
        <Chips etiqueta='Tempo' opciones={opcionesTempo} valor={tempo} onCambio={(v) => setTempo(v as FiltroTempo)} />
      )}
      <Chips etiqueta='Periodo' opciones={[{ valor: '6m', texto: '6 meses' }, { valor: '1a', texto: '1 año' }, { valor: 'todo', texto: 'Todo' }]}
        valor={periodo} onCambio={(v) => setPeriodo(v as Periodo)} />
      <div class='tarjeta'>
        {puntos.length ? <Grafica puntos={puntos} nombre={nombre} />
          : <p class='suave'>No hay registros en este periodo{tempo !== 'todas' ? ' con este filtro' : ''}. Prueba con «Todo».</p>}
        <button type='button' class='enlace' onClick={() => setTabla(!tabla)}>{tabla ? 'Ocultar datos' : 'Ver datos'}</button>
        {tabla && (
          <table class='datos'>
            <thead><tr><th>Fecha</th><th>Serie top</th><th>Reps</th><th>1RM est.</th></tr></thead>
            <tbody>{[...puntos].reverse().map((p) => <tr><td>{fechaLarga(p.fecha)}</td><td>{kg(p.kg)} kg</td><td>{p.reps}</td><td>{kg(p.e1rm)}</td></tr>)}</tbody>
          </table>
        )}
      </div>
      {conBarra(id) && rm != null && <a class='enlace-discos' href={`#/discos?ej=${id}`}>Porcentajes y discos →</a>}
      <h2>Récords por repeticiones</h2>
      <div class='marcas'>
        {records.map((m) => <span title={fechaLarga(m.fecha)}>{m.reps}RM {kg(m.kg)} kg</span>)}
      </div>
    </main>
  );
}
