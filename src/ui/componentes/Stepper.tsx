import { useEffect, useState } from 'preact/hooks';
import { parsearKg } from '../../domain/numeros';

export const fmt = (n: number) => String(n);

export function Stepper({ etiqueta, valor, paso, onCambio, min = 0 }: {
  etiqueta: string; valor: number; paso: number; onCambio: (v: number) => void; min?: number;
}) {
  const [texto, setTexto] = useState(fmt(valor));
  useEffect(() => {
    if (parsearKg(texto) !== valor) setTexto(fmt(valor));
  }, [valor]);
  const cambiar = (v: number) => { const n = Math.max(min, Math.round(v * 100) / 100); setTexto(fmt(n)); onCambio(n); };
  return (
    <div class="fila">
      <span class="etiqueta">{etiqueta}</span>
      <div class="stepper">
        <button type="button" aria-label={`Bajar ${etiqueta}`} onClick={() => cambiar(valor - paso)}>−</button>
        <input aria-label={etiqueta} inputMode="decimal" value={texto}
          onInput={(e) => {
            const t = (e.target as HTMLInputElement).value;
            setTexto(t);
            const n = parsearKg(t);
            if (n !== null) onCambio(n);
          }} />
        <button type="button" aria-label={`Subir ${etiqueta}`} onClick={() => cambiar(valor + paso)}>＋</button>
      </div>
    </div>
  );
}
