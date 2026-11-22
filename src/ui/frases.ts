/** Frases con chispa que van cambiando.
 * Reglas: cambian saludos, títulos, celebraciones, descanso, vacíos y subtítulos; NO cambian botones, datos,
 * errores ni molestias. Lo que se ve al navegar cambia una vez al día (si no, «baila»); las celebraciones,
 * cada vez y sin repetir la anterior. El dato (kg, tiempo…) va siempre en la frase. */

export const POOLS = {
  saludo: ['¿Hoy qué cae?', 'A sudar, ¿qué toca?', '¿Entrenamos o qué?', 'La barra te echa de menos', 'Hoy se viene PR (o no)', 'Calienta, que hoy se suda', 'Tiza en mano, ¿vamos?', 'Otro día, otra oportunidad'],
  manana: ['¿Madrugón? Respeto', 'Café y barra. Buen plan', 'Entrenar antes que el sol, eso es nivel', 'Buenos días, máquina'],
  noche: ['Entreno nocturno, como los valientes', 'A estas horas, ¿todavía con ganas? Bien', 'Último esfuerzo del día', 'La luna también hace PR'],
  lunes: ['Lunes. A quemar el finde', 'Lunes: el día de las promesas. Cúmplela', 'Empieza la semana fuerte'],
  viernes: ['Viernes de PR, ¿o qué?', 'Viernes: lo que caiga hoy, cuenta doble', 'Cierra la semana a lo grande'],
  ausencia: ['¿Dónde te habías metido? {n} días sin verte', '{n} días fuera. La barra pregunta por ti', 'Vuelta al cole: {n} días sin entrenar', 'Ni rastro en {n} días. ¿Hoy vuelves?'],
  racha: ['Llevas {n} semanas sin fallar. Bestia', '{n} semanas seguidas. Esto ya es costumbre', 'Racha de {n} semanas. No la rompas ahora', '{n} semanas cumpliendo. Respect'],
  rarezas: ['Hoy la barra pesa menos (mentira)', 'Dato: nadie se ha arrepentido nunca de entrenar', 'Burpees gratis para quien lea esto', 'Si te duele, es que funciona (o no, mira la sección de molestias)', 'El calentamiento también cuenta. Hazlo'],
  hero: ['¿A qué le damos caña?', '¿Qué cae hoy?', 'Elige víctima', '¿Qué levantamos hoy?', 'La barra te espera', 'Hoy toca sufrir un poco', '¿Con qué empezamos?'],
  hecho: ['Hoy ya has cumplido', 'Trabajo hecho', 'Hoy ya has sudado', 'Misión cumplida', 'Ya puedes cenar tranquilo'],
  guardado: ['Apuntado. Al saco 💪', 'Hecho. Ahora a estirar (o no)', 'Dentro. Ni una gota de sudor se pierde', 'Guardado. El box está orgulloso', 'Apuntado. Tu yo del futuro lo agradecerá', 'Registrado. Ahora, proteína'],
  prefijoPR: ['¡PR!', '¡Boom!', '¡Toma ya!', '¡Bestia!', '¡Ojo!', '¡Brutal!'],
  cierrePR: ['', ' Máquina.', ' Así se hace.', ' Que no pare.', ' Hoy cenas doble.'],
  respira: ['Respira', 'Recupera', 'Aire', 'Agua y aire', 'Pausa'],
  finDescanso: ['¡Barra! A por la siguiente', 'Se acabó el chill', 'Arriba, que se enfría', 'La barra no se levanta sola', 'Venga, la última (mentira)', '¡Vamos! Que no se diga'],
  revancha: ['¿Le das la revancha?', '¿Hoy lo bajas?', '¿Te atreves otra vez?', 'Toca superarlo', '¿Vas a por tu marca?'],
  estreno: ['Aún no te has atrevido', 'Todavía virgen. ¿Hoy?', 'Te está esperando', 'Hoy puede ser el día', 'Nunca es tarde para estrenarlo'],
  vacioHistorial: ['Aquí no hay nada aún. Ve a por la primera marca', 'Historial vacío. La barra no se va a levantar sola', 'Nada por aquí. Todavía', 'El primer entreno siempre es el más difícil. Apúntalo', 'Cero entrenos. Vamos a arreglar eso'],
  vacioCarrera: ['Ni una carrera todavía. Las zapatillas lloran', 'Cero kilómetros. Las zapatillas se aburren', 'Por aquí no ha pasado nadie corriendo', 'Las zapatillas siguen en la caja', 'Ni un trote. ¿Hoy?'],
  subHistorial: ['Todo lo que has sudado.', 'Tu diario de guerra.', 'Cada gota, apuntada.', 'Lo que has hecho, sin trampas.', 'Tu currículum de box.'],
  subProgreso: ['Cuánto has crecido, en números.', 'Los números no mienten.', 'Aquí se ve el esfuerzo.', 'Tu evolución, sin filtros.', 'Spoiler: estás mejorando.'],
  subAjustes: ['Las tripas de la app.', 'Donde se toca lo serio.', 'Sala de máquinas.', 'Los botones aburridos (pero útiles).', 'Configuración, sin sudar.'],
};

/** Días señalados: mandan sobre todo lo demás. Clave MM-DD. */
const ESPECIALES: Record<string, string> = {
  '01-01': 'Feliz año nuevo. Propósito: no fallar ni una semana',
  '01-06': 'Los Reyes te han traído… más burpees',
  '02-14': 'San Valentín: tu relación más estable es con la barra',
  '12-24': 'Nochebuena: entrena hoy, que mañana hay turrón',
  '12-25': 'Feliz Navidad. El turrón no se quema solo',
  '12-31': 'Último entreno del año. Que sea bueno',
};

const hash = (t: string) => { let h = 2166136261; for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const diaAnterior = (f: string) => new Date(Date.parse(`${f}T12:00:00Z`) - 864e5).toISOString().slice(0, 10);
const fechaLocal = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

function indiceDelDia(clave: string, n: number, fecha: string): number {
  return hash(`${clave}|${fecha}`) % n;
}

/** La misma frase todo el día; distinta de la de ayer. */
export function delDia<T>(clave: string, pool: T[], fecha = fechaLocal(new Date())): T {
  if (pool.length < 2) return pool[0];
  let i = indiceDelDia(clave, pool.length, fecha);
  const ayer = indiceDelDia(clave, pool.length, diaAnterior(fecha));
  if (i === ayer) i = (i + 1) % pool.length;
  return pool[i];
}

/** Una al azar, distinta de la última que salió en este sitio. */
export function sinRepetir<T>(clave: string, pool: T[], azar = Math.random): T {
  if (pool.length < 2) return pool[0];
  let ult = -1;
  try { ult = Number(localStorage.getItem(`frase-${clave}`) ?? -1); } catch { /* sin almacenamiento */ }
  let i = Math.floor(azar() * (pool.length - 1));
  if (i >= ult && ult >= 0) i++;
  try { localStorage.setItem(`frase-${clave}`, String(i)); } catch { /* sin almacenamiento */ }
  return pool[i];
}

/** Una de cada veinte veces, una rareza. */
export function conSorpresa(pool: string[], azar = Math.random): string {
  return azar() < 0.05 ? POOLS.rarezas[Math.floor(azar() * 1000) % POOLS.rarezas.length] : pool[0];
}

export interface Contexto { entrenadoHoy: boolean; diasSinEntrenar: number | null; racha: number }

/** Saludo del inicio según el momento. Cambia una vez al día (dentro de cada situación). */
export function saludo(c: Contexto, ahora = new Date(), _azar = Math.random): string {
  const f = fechaLocal(ahora);
  const especial = ESPECIALES[f.slice(5)];
  if (especial) return especial;
  if (c.diasSinEntrenar != null && c.diasSinEntrenar >= 8) return delDia('ausencia', POOLS.ausencia, f).replace('{n}', String(c.diasSinEntrenar));
  if (c.racha >= 4) return delDia('racha', POOLS.racha, f).replace('{n}', String(c.racha));
  // La rareza también es «del día»: si sale, sale todo el día.
  if (hash(`rareza|${f}`) % 20 === 0) return delDia('rarezas', POOLS.rarezas, f);
  const h = ahora.getHours(), dia = ahora.getDay();
  if (h < 9) return delDia('manana', POOLS.manana, f);
  if (h >= 21) return delDia('noche', POOLS.noche, f);
  if (dia === 1) return delDia('lunes', POOLS.lunes, f);
  if (dia === 5) return delDia('viernes', POOLS.viernes, f);
  return delDia('saludo', POOLS.saludo, f);
}

// Compatibilidad con el resto de la app.
export const elegir = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
export const GUARDADO = POOLS.guardado;
export const PREFIJO_PR = POOLS.prefijoPR;
export const CIERRE_PR = POOLS.cierrePR;
export const FIN_DESCANSO = POOLS.finDescanso;
