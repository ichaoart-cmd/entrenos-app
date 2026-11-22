import { useState } from 'preact/hooks';
import { estado } from '../store/estado';

export interface Respuestas { nota?: number; gusta: string; cambia: string; usaria?: string; pagaria?: string }

export function mensajeOpinion(r: Respuestas, uso: { sesiones: number }): string {
  return [
    '💪 Mi opinión sobre Entrenos (beta)',
    `Nota: ${r.nota ?? '—'}/5`,
    `Me gusta: ${r.gusta.trim() || '—'}`,
    `Cambiaría / echo en falta: ${r.cambia.trim() || '—'}`,
    `¿La usaría de verdad?: ${r.usaria ?? '—'}`,
    `¿Pagaría?: ${r.pagaria ?? '—'}`,
    `(Entrenos apuntados: ${uso.sesiones})`,
  ].join('\n');
}

function Opciones({ etiqueta, opciones, valor, onCambio }: { etiqueta: string; opciones: string[]; valor?: string; onCambio: (v: string) => void }) {
  return (
    <div class='opinion-opciones' role='group' aria-label={etiqueta}>
      {opciones.map((o) => <button type='button' class='chip' aria-pressed={valor === o} onClick={() => onCambio(o)}>{o}</button>)}
    </div>
  );
}

/** Formulario de opinión para quien prueba la beta; se envía por WhatsApp (o se comparte), sin servidor. */
export function Opinion() {
  const [r, setR] = useState<Respuestas>({ gusta: '', cambia: '' });
  const set = (c: Partial<Respuestas>) => setR({ ...r, ...c });
  const d = estado.datos.value;
  const texto = mensajeOpinion(r, { sesiones: d.sesiones.filter((s) => !s.borrado).length + d.carreras.filter((c) => !c.borrado).length });
  const compartir = async () => { try { await navigator.share?.({ text: texto }); } catch { /* cancelado */ } };
  return (
    <main class='pagina'>
      <div class='cabecera-registro'>
        <a href='#/' aria-label='Volver' class='volver'>←</a>
        <h1>¿Qué tal?</h1>
      </div>
      <p class='subtitulo'>Estás probando una beta. Sé sincero, que para eso está.</p>
      <section class='tarjeta opinion'>
        <h3>Del 1 al 5, ¿qué nota le das?</h3>
        <Opciones etiqueta='Nota' opciones={['1', '2', '3', '4', '5']} valor={r.nota != null ? String(r.nota) : undefined} onCambio={(v) => set({ nota: Number(v) })} />
        <label class='etiq' for='op-gusta'>¿Qué te ha gustado?</label>
        <textarea id='op-gusta' aria-label='¿Qué te ha gustado?' value={r.gusta} onInput={(e) => set({ gusta: (e.target as HTMLTextAreaElement).value })} />
        <label class='etiq' for='op-cambia'>¿Qué cambiarías o echas en falta?</label>
        <textarea id='op-cambia' aria-label='¿Qué cambiarías o echas en falta?' value={r.cambia} onInput={(e) => set({ cambia: (e.target as HTMLTextAreaElement).value })} />
        <h3>¿La usarías de verdad en el box?</h3>
        <Opciones etiqueta='¿La usarías?' opciones={['Sí', 'Puede', 'No']} valor={r.usaria} onCambio={(v) => set({ usaria: v })} />
        <h3>¿Pagarías por ella?</h3>
        <Opciones etiqueta='¿Pagarías?' opciones={['No', '1-2 €/mes', '3-5 €/mes', 'Pago único']} valor={r.pagaria} onCambio={(v) => set({ pagaria: v })} />
      </section>
      <div class='fila'>
        <a class='accion envio' href={`https://wa.me/?text=${encodeURIComponent(texto)}`} target='_blank' rel='noopener'>Enviar por WhatsApp</a>
        {typeof navigator !== 'undefined' && 'share' in navigator && <button type='button' onClick={compartir}>Compartir por otra app</button>}
      </div>
      <p class='suave'>Se abre WhatsApp con el mensaje escrito: elige a quien te pasó la app y envíalo.</p>
    </main>
  );
}
