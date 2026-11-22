import { useState } from 'preact/hooks';
import { estado, quitarPeso, registrarPeso } from '../store/estado';
import { nuevoId } from '../domain/ids';
import { Stepper } from './componentes/Stepper';
import { fechaLarga } from './formato';
import { hoy } from './Registrar';
import { sonar } from './sonido';

const coma = (n: number) => String(n).replace('.', ',');

/** Peso corporal: se apunta de vez en cuando y sirve para la fuerza relativa (× tu peso). */
export function TarjetaPeso() {
  const pesos = (estado.datos.value.pesos ?? []).filter((p) => !p.borrado).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const ult = pesos[0];
  const [kg, setKg] = useState(ult?.kg ?? 75);
  const [hist, setHist] = useState(false);
  const [hecho, setHecho] = useState(false);
  const apuntar = async () => {
    const h = hoy();
    const deHoy = pesos.find((p) => p.fecha === h);
    await registrarPeso({ id: deHoy?.id ?? nuevoId(), actualizado: '', fecha: h, kg: Math.round(kg * 10) / 10 });
    sonar('guardado'); setHecho(true); setTimeout(() => setHecho(false), 2000);
  };
  return (
    <section class='tarjeta peso-corporal' aria-label='Peso corporal'>
      <h3>Peso corporal</h3>
      <p class='suave'>{ult ? `Último: ${coma(ult.kg)} kg (${fechaLarga(ult.fecha)}). Sirve para ver tu fuerza relativa.` : 'Súbete a la báscula de vez en cuando y te digo cuánto mueves respecto a tu peso.'}</p>
      <div class='fila'>
        <Stepper etiqueta='Peso corporal (kg)' valor={kg} paso={0.5} min={30} onCambio={setKg} />
      </div>
      <div class='fila'>
        <button type='button' class='primario' onClick={apuntar}>{hecho ? 'Apuntado ✓' : 'Apuntar peso de hoy'}</button>
        {pesos.length > 0 && <button type='button' class='enlace' aria-expanded={hist} onClick={() => setHist(!hist)}>{hist ? 'Ocultar' : 'Historial'}</button>}
      </div>
      {hist && (
        <ul class='hist-peso'>
          {pesos.map((p) => <li><span>{fechaLarga(p.fecha)}</span><b>{coma(p.kg)} kg</b><button type='button' class='enlace' aria-label={`Borrar peso del ${fechaLarga(p.fecha)}`} onClick={() => quitarPeso(p.id)}>Borrar</button></li>)}
        </ul>
      )}
    </section>
  );
}
