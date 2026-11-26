import { useEffect, useState } from 'preact/hooks';
import { estado } from '../store/estado';
import { resumenMes, type ResumenMes } from '../domain/resumen';
import { entrada } from '../domain/catalogo';
import { hoy } from './Registrar';
import { AMARILLO, CIELO, MENTA, ROSA } from './coloresGrafica';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const nombreMes = (m: string) => MESES[Number(m.slice(5, 7)) - 1];
const coma = (n: number) => String(n).replace('.', ',');
const mover = (mes: string, n: number) => { const d = new Date(mes + '-01T00:00:00Z'); d.setUTCMonth(d.getUTCMonth() + n); return d.toISOString().slice(0, 7); };
const NEGRO = '#141414', CREMA = '#faf3e3', BLANCO = '#fffdf7';

/** Frase de cierre según cómo ha ido el mes. */
function remate(r: ResumenMes): string {
  if (r.dias === 0) return 'Mes de descanso. El próximo, a recuperar.';
  if (r.records.length >= 3) return 'Mes de récords. La barra te tiene miedo.';
  if (r.dias > r.diasMesAnterior) return 'Más que el mes pasado. Así, sí.';
  if (r.dias >= 12) return 'Constancia de manual.';
  return 'Cada día cuenta. Y este mes, cuentan.';
}

/** Texto plano del resumen (para el alt de la imagen y para el mensaje al compartir). */
export function textoResumen(r: ResumenMes): string {
  const partes = [`${r.dias} días entrenando en ${nombreMes(r.mes)}`];
  if (r.fuerza) partes.push(`${r.fuerza} de fuerza`);
  if (r.metcons) partes.push(`${r.metcons} metcons`);
  if (r.km) partes.push(`${coma(r.km)} km corridos`);
  if (r.records.length) partes.push(`${r.records.length} ${r.records.length === 1 ? 'récord' : 'récords'}`);
  return partes.join(', ') + '.';
}

/** Dibuja la tarjeta 1080×1350 (formato vertical de redes) en estilo pop. */
async function dibujar(r: ResumenMes): Promise<HTMLCanvasElement | null> {
  const c = document.createElement('canvas');
  c.width = 1080; c.height = 1350;
  const x = c.getContext('2d');
  if (!x) return null;
  try { await Promise.all(["850 80px 'Archivo Variable'", "700 30px 'Space Mono'", "400 30px 'Space Mono'"].map((f) => document.fonts.load(f))); } catch { /* sin fuentes */ }
  const ancha = (peso: number, px: number) => { x.font = `${peso} ${px}px 'Archivo Variable', system-ui, sans-serif`; try { (x as any).fontStretch = 'expanded'; } catch { /* */ } };
  const mono = (peso: number, px: number) => { x.font = `${peso} ${px}px 'Space Mono', ui-monospace, monospace`; try { (x as any).fontStretch = 'normal'; } catch { /* */ } };
  const encajar = (t: string, max: number, peso: number, px: number) => { ancha(peso, px); while (x.measureText(t).width > max && px > 20) ancha(peso, (px -= 4)); };
  const caja = (cx: number, cy: number, w: number, h: number, fondo: string) => {
    x.beginPath(); x.roundRect(cx + 12, cy + 12, w, h, 28); x.fillStyle = NEGRO; x.fill();
    x.beginPath(); x.roundRect(cx, cy, w, h, 28); x.fillStyle = fondo; x.fill(); x.lineWidth = 6; x.strokeStyle = NEGRO; x.stroke();
  };
  const dato = (cx: number, cy: number, w: number, h: number, fondo: string, cifra: string, etiqueta: string) => {
    caja(cx, cy, w, h, fondo);
    x.fillStyle = NEGRO; x.textAlign = 'left';
    encajar(cifra, w - 60, 850, 96); x.fillText(cifra, cx + 30, cy + h - 80);
    mono(700, 26); x.fillText(etiqueta.toUpperCase(), cx + 30, cy + h - 34);
  };

  x.fillStyle = CREMA; x.fillRect(0, 0, 1080, 1350);
  x.fillStyle = NEGRO; x.textAlign = 'left';
  mono(700, 30); x.fillText('ENTRENOS · RESUMEN DEL MES', 60, 92);
  encajar(nombreMes(r.mes).toUpperCase(), 820, 850, 130); x.fillText(nombreMes(r.mes).toUpperCase(), 56, 216);
  mono(700, 44); x.textAlign = 'right'; x.fillText(r.mes.slice(0, 4), 1020, 216); x.textAlign = 'left';

  // Días entrenando, la cifra estrella.
  caja(60, 260, 960, 250, AMARILLO);
  x.fillStyle = NEGRO; ancha(850, 190); x.fillText(String(r.dias), 96, 455);
  const ancho = x.measureText(String(r.dias)).width;
  ancha(850, 50); x.fillText(r.dias === 1 ? 'DÍA' : 'DÍAS', 120 + ancho, 395);
  x.fillText('ENTRENANDO', 120 + ancho, 450);
  const dif = r.dias - r.diasMesAnterior;
  if (r.diasMesAnterior || r.dias) { mono(700, 26); x.textAlign = 'right'; x.fillText(`${dif > 0 ? '+' : dif < 0 ? '−' : '±'}${Math.abs(dif)} VS ${nombreMes(mover(r.mes, -1)).toUpperCase()}`, 990, 310); x.textAlign = 'left'; }

  dato(60, 550, 465, 210, ROSA, String(r.fuerza), 'sesiones de fuerza');
  dato(555, 550, 465, 210, MENTA, String(r.metcons), 'metcons');
  dato(60, 800, 465, 210, CIELO, `${coma(r.km)} km`, `${r.carreras} ${r.carreras === 1 ? 'carrera' : 'carreras'}`);
  dato(555, 800, 465, 210, BLANCO, `${coma(Math.round(r.volumenKg / 100) / 10)} t`, 'movidas en fuerza');

  // Récords.
  caja(60, 1050, 960, 200, BLANCO);
  x.fillStyle = NEGRO; mono(700, 26); x.fillText(`★ RÉCORDS (${r.records.length})`, 96, 1100);
  if (r.records.length) {
    r.records.slice(0, 3).forEach((p, i) => {
      const nombre = entrada(p.ejercicio)?.corto ?? p.ejercicio;
      ancha(800, 32); x.fillText(nombre.toUpperCase(), 96, 1146 + i * 40);
      mono(700, 30); x.textAlign = 'right'; x.fillText(`${p.reps} × ${coma(p.kg)} kg`, 984, 1146 + i * 40); x.textAlign = 'left';
    });
  } else { ancha(800, 34); x.fillText('ESTE MES TOCABA SEMBRAR', 96, 1170); }

  // Pie: peso y logros si los hay, y la frase.
  mono(700, 24); x.fillStyle = NEGRO;
  const pie = [r.pesoCambio != null ? `PESO ${r.pesoCambio > 0 ? '+' : r.pesoCambio < 0 ? '−' : '±'}${coma(Math.abs(r.pesoCambio))} KG` : '', r.logros.length ? `${r.logros.length} ${r.logros.length === 1 ? 'LOGRO' : 'LOGROS'}` : ''].filter(Boolean).join(' · ');
  x.fillText(remate(r).toUpperCase(), 60, 1310);
  if (pie) { x.textAlign = 'right'; x.fillText(pie, 1020, 1310); }
  return c;
}

export function TarjetaResumen() {
  const mes = hoy().slice(0, 7);
  const r = resumenMes(estado.datos.value, mes, estado.ajustes.value.minSesionesSemana);
  return (
    <a class='ejercicio-progreso enlace-ficha' href={`#/resumen?mes=${mes}`} aria-label='Resumen del mes'>
      <header>
        <span class='disco calendario-mini'><b>{r.dias}</b></span>
        <div><h3>Tu {nombreMes(mes)}</h3><span class='suave' style='font-size:0.8rem'>Resumen para compartir</span></div>
        <div class='rm'><b>{r.records.length}</b><span>{r.records.length === 1 ? 'récord' : 'récords'}</span></div>
      </header>
    </a>
  );
}

export function Resumen({ mes: mesInicial }: { mes?: string }) {
  const actual = hoy().slice(0, 7);
  const [mes, setMes] = useState(mesInicial && /^\d{4}-\d{2}$/.test(mesInicial) ? mesInicial : actual);
  const [img, setImg] = useState<{ url: string; blob: Blob } | null>(null);
  const [aviso, setAviso] = useState('');
  const r = resumenMes(estado.datos.value, mes, estado.ajustes.value.minSesionesSemana);
  useEffect(() => {
    let vivo = true; setImg(null);
    void dibujar(r).then((c) => c?.toBlob((b) => { if (vivo && b) setImg({ url: URL.createObjectURL(b), blob: b }); }, 'image/png'));
    return () => { vivo = false; };
  }, [mes, estado.datos.value]);
  const archivo = () => new File([img!.blob], `entrenos-${mes}.png`, { type: 'image/png' });
  const compartir = async () => {
    const f = archivo();
    if (navigator.canShare?.({ files: [f] })) {
      try { await navigator.share({ files: [f], text: textoResumen(r) }); } catch { /* cancelado */ }
    } else descargar();
  };
  const descargar = () => {
    const a = document.createElement('a'); a.href = img!.url; a.download = `entrenos-${mes}.png`; a.click();
    setAviso('Imagen descargada. Búscala en Descargas.'); setTimeout(() => setAviso(''), 3000);
  };

  return (
    <main class='pagina resumen-mes'>
      <div class='cabecera-registro'>
        <a href='#/progreso' aria-label='Volver' class='volver'>←</a>
        <h1>Tu mes</h1>
      </div>
      <div class='selector-mes'>
        <button type='button' aria-label='Mes anterior' onClick={() => setMes(mover(mes, -1))}>‹</button>
        <b>{nombreMes(mes)} {mes.slice(0, 4)}</b>
        <button type='button' aria-label='Mes siguiente' disabled={mes >= actual} onClick={() => setMes(mover(mes, 1))}>›</button>
      </div>
      <div class='lienzo'>
        {img ? <img src={img.url} alt={textoResumen(r)} /> : <p class='suave'>{textoResumen(r)}</p>}
      </div>
      <div class='fila'>
        <button type='button' class='primario' disabled={!img} onClick={compartir}>Compartir</button>
        <button type='button' class='enlace' disabled={!img} onClick={descargar}>Descargar imagen</button>
      </div>
      {aviso && <p class='suave' role='status'>{aviso}</p>}
    </main>
  );
}
