export function Chips<T extends string>({ opciones, valor, onCambio, etiqueta }: {
  opciones: { valor: T; texto: string }[]; valor: T | undefined; onCambio: (v: T) => void; etiqueta: string;
}) {
  return (
    <div class="chips" role="group" aria-label={etiqueta}>
      {opciones.map((o) => (
        <button type="button" class="chip" aria-pressed={o.valor === valor} onClick={() => onCambio(o.valor)}>
          {o.texto}
        </button>
      ))}
    </div>
  );
}
