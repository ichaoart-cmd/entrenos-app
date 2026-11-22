import type { FormatoMetcon, Metcon } from '../domain/types';
import { useState } from 'preact/hooks';
import { Chips } from './componentes/Chips';
import { BENCHMARKS, MOVIMIENTOS, mejorBenchmark } from '../domain/benchmarks';
import { estado } from '../store/estado';

const FORMATOS: { valor: FormatoMetcon; texto: string }[] = [
  { valor: 'AMRAP', texto: 'AMRAP' }, { valor: 'ForTime', texto: 'For Time' }, { valor: 'EMOM', texto: 'EMOM' },
  { valor: 'Intervalos', texto: 'Intervalos' }, { valor: 'Otro', texto: 'Otro' },
];

function partes(m: Metcon): string[] {
  return m.resultado?.valor ? m.resultado.valor.split(/[+/]/) : [];
}

export function MetconForm({ metcon, onCambio, onQuitar }: { metcon: Metcon; onCambio: (m: Metcon) => void; onQuitar: () => void }) {
  const set = (cambios: Partial<Metcon>) => {
    const m = { ...metcon, ...cambios };
    for (const k of Object.keys(m) as (keyof Metcon)[]) if (m[k] === undefined) delete m[k];
    onCambio(m);
  };
  const [lista, setLista] = useState(false);
  const bm = BENCHMARKS.find((b) => b.id === metcon.benchmark);
  const mejor = bm ? mejorBenchmark(estado.datos.value.sesiones, bm.id) : null;
  const elegir = (id: string) => {
    const b = BENCHMARKS.find((x) => x.id === id)!;
    set({ benchmark: b.id, formato: b.formato, duracionMin: b.duracionMin, descripcion: b.descripcion, movimientos: [...b.movimientos], resultado: undefined });
    setLista(false);
  };
  const alternar = (id: string) => {
    const ms = metcon.movimientos ?? [];
    const nuevos = ms.includes(id) ? ms.filter((x) => x !== id) : [...ms, id];
    set({ movimientos: nuevos.length ? nuevos : undefined });
  };
  const p = partes(metcon);
  const val = (id: string) => (e: Event) => (e.target as HTMLInputElement).value.trim();
  let resultado;
  if (metcon.formato === 'AMRAP') {
    const r = (rondas: string, reps: string) =>
      set({ resultado: rondas || reps ? { tipo: 'rondas+reps', valor: `${rondas || '0'}+${reps || '0'}` } : undefined });
    resultado = (
      <div class="fila">
        <label class="etiqueta">Rondas <input aria-label="Rondas" inputMode="numeric" size={4} value={p[0] ?? ''} onInput={(e) => r(val('r')(e), p[1] ?? '')} /></label>
        <label class="etiqueta">+ reps <input aria-label="Reps extra" inputMode="numeric" size={4} value={p[1] ?? ''} onInput={(e) => r(p[0] ?? '', val('x')(e))} /></label>
      </div>
    );
  } else if (metcon.formato === 'ForTime') {
    resultado = (
      <div class="fila"><label class="etiqueta">Tiempo
        <input aria-label="Tiempo (mm:ss)" inputMode="numeric" placeholder="mm:ss" value={metcon.resultado?.valor ?? ''}
          onInput={(e) => { const v = val('t')(e); set({ resultado: v ? { tipo: 'tiempo', valor: v } : undefined }); }} />
      </label></div>
    );
  } else if (metcon.formato === 'EMOM' || metcon.formato === 'Intervalos') {
    resultado = (
      <div class="fila"><label class="etiqueta">Reps (total o por bloque: 40/51)
        <input aria-label="Reps" inputMode="text" value={metcon.resultado?.valor ?? ''}
          onInput={(e) => {
            const v = val('b')(e).replace(/\s+/g, '');
            set({ resultado: v ? { tipo: v.includes('/') ? 'bloques' : 'reps', valor: v } : undefined });
          }} />
      </label></div>
    );
  } else {
    resultado = (
      <div class="fila"><label class="etiqueta">Resultado
        <input aria-label="Resultado" value={metcon.resultado?.valor ?? ''}
          onInput={(e) => { const v = val('o')(e); set({ resultado: v ? { tipo: 'reps', valor: v } : undefined }); }} />
      </label></div>
    );
  }
  return (
    <section class="tarjeta">
      <h2>Metcon</h2>
      <div class='wod-ref'>
        {bm ? (
          <div class='wod-elegido'>
            <b>{bm.nombre}</b>
            <span>{mejor ? `Tu mejor: ${mejor.valor}${mejor.rx ? ' RX' : ''} (${mejor.fecha.split('-').reverse().join('/')})` : 'Primera vez: hoy marcas tu referencia'}</span>
            <button type='button' class='enlace' onClick={() => set({ benchmark: undefined })}>Quitar</button>
          </div>
        ) : (
          <button type='button' class='boton' aria-expanded={lista} onClick={() => setLista(!lista)}>WOD de referencia</button>
        )}
        {lista && !bm && (
          <div class='lista-wods' role='group' aria-label='WODs de referencia'>
            {BENCHMARKS.map((b) => {
              const mb = mejorBenchmark(estado.datos.value.sesiones, b.id);
              return <button type='button' onClick={() => elegir(b.id)}><b>{b.nombre}</b><small>{mb ? `Tu mejor: ${mb.valor}` : b.descripcion}</small></button>;
            })}
          </div>
        )}
      </div>
      <Chips etiqueta="Formato" opciones={FORMATOS} valor={metcon.formato} onCambio={(f) => set({ formato: f, resultado: undefined })} />
      {resultado}
      <div class="fila">
        <label class="etiqueta">Minutos <input aria-label="Minutos" inputMode="numeric" size={4} value={metcon.duracionMin ?? ''}
          onInput={(e) => { const n = parseInt((e.target as HTMLInputElement).value, 10); set({ duracionMin: Number.isFinite(n) ? n : undefined }); }} /></label>
      </div>
      <div class="fila">
        <Chips etiqueta="RX" opciones={[{ valor: 'rx', texto: 'RX' }, { valor: 'esc', texto: 'Escalado' }]}
          valor={metcon.rx === false ? 'esc' : 'rx'} onCambio={(v) => set({ rx: v === 'rx' })} />
        <Chips etiqueta="Equipo" opciones={[{ valor: 'si', texto: 'En equipo' }]}
          valor={metcon.equipo ? 'si' : undefined} onCambio={() => set({ equipo: !metcon.equipo })} />
      </div>
      <div class='etiq'>Movimientos</div>
      <div class='movimientos' role='group' aria-label='Movimientos'>
        {MOVIMIENTOS.map((m) => (
          <button type='button' aria-pressed={(metcon.movimientos ?? []).includes(m.id)} aria-label={m.nombre} onClick={() => alternar(m.id)}>
            <img src={`${import.meta.env.BASE_URL}ilustraciones/${m.ilustracion}.webp`} width={44} height={44} alt='' loading='lazy' />
            <span aria-hidden='true'>{m.nombre}</span>
          </button>
        ))}
      </div>
      <textarea aria-label="Descripción" placeholder="Descripción (opcional)" value={metcon.descripcion ?? ''}
        onInput={(e) => set({ descripcion: (e.target as HTMLTextAreaElement).value || undefined })} />
      <div class="fila"><button type="button" class="peligro" onClick={onQuitar}>Quitar Metcon</button></div>
    </section>
  );
}
