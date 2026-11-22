export function Aviso({ texto, record = false }: { texto: string; record?: boolean }) {
  return <div class={`aviso${record ? ' record' : ''}`} role="status">{texto}</div>;
}
