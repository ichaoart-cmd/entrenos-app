/** Frases con chispa. Las celebraciones rotan para que el récord número veinte no suene igual que el primero.
 * Regla: el dato (kg, tiempo, reps) va siempre en la frase; errores y molestias, sin cachondeo. */
export const elegir = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

export const GUARDADO = ['Apuntado. Al saco 💪', 'Hecho. Ahora a estirar (o no)', 'Dentro. Ni una gota de sudor se pierde', 'Guardado. El box está orgulloso'];
export const PREFIJO_PR = ['¡PR!', '¡Boom!', '¡Toma ya!', '¡Bestia!'];
export const CIERRE_PR = ['', ' Máquina.', ' Así se hace.', ' Que no pare.'];
export const FIN_DESCANSO = ['¡Barra! A por la siguiente', '¡Arriba! Se acabó el chill', '¡Vamos! La barra no se levanta sola'];
