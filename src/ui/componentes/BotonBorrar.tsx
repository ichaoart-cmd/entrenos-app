import { useState } from 'preact/hooks';

/** Botón de borrar con confirmación en la propia pantalla. */
export function BotonBorrar({ texto, onBorrar }: { texto: string; onBorrar: () => void }) {
  const [confirmar, setConfirmar] = useState(false);
  return confirmar ? (
    <div class='borrar-confirmar' role='group' aria-label='Confirmar borrado'>
      <span>¿Seguro? No se puede deshacer.</span>
      <button type='button' class='peligro-lleno' onClick={onBorrar}>Sí, borrar</button>
      <button type='button' onClick={() => setConfirmar(false)}>Cancelar</button>
    </div>
  ) : (
    <button type='button' class='boton-borrar' onClick={() => setConfirmar(true)}>{texto}</button>
  );
}
