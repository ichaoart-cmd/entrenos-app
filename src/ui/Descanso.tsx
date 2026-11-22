import { useEffect, useState } from 'preact/hooks';
import { descanso, pararDescanso, restanteSeg, sumarDescanso } from '../store/descanso';
import { avisoFin, sonar } from './sonido';
import { formatearTiempo } from '../domain/carrera';
import { usarPantallaEncendida } from './pantalla';

/** Temporizador flotante sobre la barra de abajo; visible en toda la app mientras dura el descanso. */
export function Descanso() {
  const fin = descanso.value;
  const [, setTic] = useState(0);
  const [acabado, setAcabado] = useState(false);
  usarPantallaEncendida(fin != null);
  useEffect(() => {
    if (fin == null) return;
    setAcabado(false);
    let avisado = false, ultimo = -1;
    const id = setInterval(() => {
      setTic((x) => x + 1);
      const r = restanteSeg();
      // Cuenta atrás audible en los 3 últimos segundos.
      if (r !== ultimo && r >= 1 && r <= 3) sonar('cuenta');
      ultimo = r;
      if (!avisado && restanteSeg() === 0) {
        avisado = true; setAcabado(true); avisoFin();
        setTimeout(() => { pararDescanso(); setAcabado(false); }, 3500);
      }
    }, 250);
    return () => clearInterval(id);
  }, [fin]);
  if (fin == null) return null;
  return (
    <div class={`descanso${acabado ? ' acabado' : ''}`} role='timer' aria-live={acabado ? 'assertive' : 'off'}>
      {acabado ? <b>¡A por la siguiente!</b> : <>
        <span class='etq'>Descanso</span>
        <b>{formatearTiempo(restanteSeg())}</b>
        <button type='button' aria-label='Sumar 30 segundos' onClick={() => sumarDescanso(30)}>+30</button>
        <button type='button' aria-label='Parar descanso' onClick={pararDescanso}>✕</button>
      </>}
    </div>
  );
}
