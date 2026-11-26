import { useState } from 'preact/hooks';
import { estado } from '../store/estado';
import { BARRAS, conBarra, discosPorLado, tablaPorcentajes } from '../domain/discos';
import { mejor1RM } from '../domain/peso';
import { ROTACION } from '../domain/records';
import { CATALOGO, entrada } from '../domain/catalogo';
import { Stepper } from './componentes/Stepper';
import { Chips } from './componentes/Chips';
import { AMARILLO, CIELO, FONDO, MENTA, MONO, ROSA, TINTA } from './coloresGrafica';

const coma = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
const CLAVE_BARRA = 'entrenos-barra';

export function barraPreferida(): number {
  try { const b = Number(localStorage.getItem(CLAVE_BARRA)); return BARRAS.includes(b) ? b : 20; } catch { return 20; }
}
export function guardarBarra(b: number) { try { localStorage.setItem(CLAVE_BARRA, String(b)); } catch { /* sin almacenamiento */ } }

/** «20 + 10 + 2,5» o «solo la barra». */
export function textoLado(lado: number[]): string {
  return lado.length ? lado.map(coma).join(' + ') : 'solo la barra';
}

/** Colores de bumper de toda la vida (rojo 25, azul 20, amarillo 15, verde 10, blanco 5) en versión pop. */
const COLOR: Record<number, string> = { 25: '#ef7b6b', 20: CIELO, 15: AMARILLO, 10: MENTA, 5: FONDO, 2.5: ROSA, 1.25: '#d6d1c4' };
const ALTO: Record<number, number> = { 25: 1, 20: 1, 15: 1, 10: 1, 5: 0.7, 2.5: 0.55, 1.25: 0.45 };
const ANCHO: Record<number, number> = { 25: 17, 20: 15, 15: 13, 10: 11, 5: 9, 2.5: 8, 1.25: 7 };

/** Dibujo de la barra montada, con los discos de cada lado como en el box. */
export function BarraMontada({ lado, barra }: { lado: number[]; barra: number }) {
  const W = 340, H = 130, cy = H / 2, maxH = 108;
  const discos = (sentido: 1 | -1) => {
    let x = W / 2 + sentido * 62;
    return lado.map((d) => {
      const w = ANCHO[d] ?? 8, h = maxH * (ALTO[d] ?? 0.5);
      const rx = sentido === 1 ? x : x - w;
      x += sentido * (w + 2);
      return (
        <g>
          <rect x={rx} y={cy - h / 2} width={w} height={h} rx='3' fill={COLOR[d] ?? FONDO} stroke={TINTA} stroke-width='2' />
          {w >= 11 && <text x={rx + w / 2} y={cy + 3.5} text-anchor='middle' font-size='9' font-weight='700' font-family={MONO} fill={TINTA}
            transform={`rotate(-90 ${rx + w / 2} ${cy})`}>{coma(d)}</text>}
        </g>
      );
    });
  };
  return (
    <svg class='barra-montada' viewBox={`0 0 ${W} ${H}`} role='img' aria-label={`Barra de ${barra} kg con ${textoLado(lado)} por lado`}>
      <line x1='6' x2={W - 6} y1={cy} y2={cy} stroke={TINTA} stroke-width='6' stroke-linecap='round' />
      <rect x={W / 2 - 60} y={cy - 7} width='6' height='14' rx='2' fill={TINTA} />
      <rect x={W / 2 + 54} y={cy - 7} width='6' height='14' rx='2' fill={TINTA} />
      <text x={W / 2} y={cy - 10} text-anchor='middle' font-size='10' font-weight='700' font-family={MONO} fill={TINTA}>barra {barra}</text>
      {discos(-1)}
      {discos(1)}
    </svg>
  );
}

/** Ejercicios con barra que ya tienen 1RM estimado, primero los de la rotación. */
function conMarca() {
  const ses = estado.datos.value.sesiones;
  const orden = [...CATALOGO].sort((a, b) => {
    const ia = ROTACION.indexOf(a.id), ib = ROTACION.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  return orden.filter((e) => conBarra(e.id)).map((e) => ({ id: e.id, rm: mejor1RM(ses, e.id) })).filter((x): x is { id: string; rm: number } => x.rm != null);
}

export function Discos({ ej, kg: kgInicial }: { ej?: string; kg?: number }) {
  const [barra, setBarra] = useState(barraPreferida());
  const [kg, setKg] = useState(kgInicial && kgInicial > 0 ? kgInicial : 60);
  const marcas = conMarca();
  const [ejercicio, setEjercicio] = useState(ej && marcas.some((m) => m.id === ej) ? ej : marcas[0]?.id);
  const { lado, total } = discosPorLado(kg, barra);
  const rm = marcas.find((m) => m.id === ejercicio)?.rm;
  const cambiarBarra = (b: number) => { setBarra(b); guardarBarra(b); if (kg < b) setKg(b); };

  return (
    <main class='pagina discos'>
      <div class='cabecera-registro'>
        <a href={ej ? `#/progreso?ej=${ej}` : '#/'} aria-label='Volver' class='volver'>←</a>
        <h1>Discos</h1>
      </div>
      <p class='subtitulo'>Dime el peso y te digo qué cargar. Sin sacar el móvil a hacer cuentas.</p>
      <section class='tarjeta' aria-label='Calculadora de discos'>
        <div class='etiq'>Barra</div>
        <Chips etiqueta='Barra' opciones={BARRAS.map((b) => ({ valor: String(b), texto: `${b} kg` }))} valor={String(barra)} onCambio={(v) => cambiarBarra(Number(v))} />
        <div class='peso-grande'>
          <Stepper etiqueta='Peso total (kg)' valor={kg} paso={2.5} min={barra} onCambio={setKg} />
        </div>
        <BarraMontada lado={lado} barra={barra} />
        <p class='por-lado' aria-live='polite'><small>Por lado</small><b>{textoLado(lado)}</b></p>
        {Math.abs(total - kg) > 0.01 && <p class='suave'>{coma(kg)} kg no sale exacto con discos de 1,25: te monto {coma(total)} kg.</p>}
      </section>

      {marcas.length > 0 && ejercicio && rm != null && <>
        <h2>Porcentajes de tu 1RM</h2>
        <Chips etiqueta='Ejercicio' opciones={marcas.slice(0, 8).map((m) => ({ valor: m.id, texto: entrada(m.id)?.corto ?? m.id }))} valor={ejercicio} onCambio={setEjercicio} />
        <div class='tarjeta tabla-porcentajes'>
          <p class='suave' style='margin:0 0 6px'>1RM estimado de {entrada(ejercicio)?.nombre}: <b>{Math.round(rm)} kg</b>. Toca una fila para montarla arriba.</p>
          {tablaPorcentajes(rm, barra).map((f) => (
            <button type='button' class='fila-porcentaje' aria-pressed={Math.abs(f.kg - total) < 0.01}
              onClick={() => { setKg(f.kg); scrollTo({ top: 0, behavior: 'smooth' }); }}>
              <span class='p'>{f.p} %</span><b>{coma(f.kg)} kg</b><small>{textoLado(discosPorLado(f.kg, barra).lado)}</small>
            </button>
          ))}
        </div>
      </>}
      {marcas.length === 0 && <p class='suave'>Cuando registres algo con barra, aquí tendrás tus porcentajes calculados.</p>}
    </main>
  );
}
