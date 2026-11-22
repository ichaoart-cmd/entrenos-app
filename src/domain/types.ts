export type Lugar = 'box' | 'casa';
export type FormatoMetcon = 'AMRAP' | 'EMOM' | 'ForTime' | 'Intervalos' | 'Otro';
export type TipoResultado = 'rondas+reps' | 'tiempo' | 'reps' | 'kg' | 'bloques';

export interface Base { id: string; actualizado: string; borrado?: boolean }
export interface Ejercicio { id: string; nombre: string; grupo: string }
export interface Objetivo { series: number[]; reps: number[] }
export interface Fuerza {
  ejercicio: string; variante?: string; reps: number | null; series: number[]; tempo?: string; nota?: string;
  /** Reps de cada serie cuando no son todas iguales (p. ej. pirámides). `reps` = las de la serie más pesada. */
  repsSeries?: number[];
  /** Lo planeado antes de entrenar. `series`/`repsSeries` guardan lo realmente hecho. */
  objetivo?: Objetivo;
}
export interface Metcon {
  formato: FormatoMetcon; duracionMin?: number; equipo?: boolean;
  resultado?: { tipo: TipoResultado; valor: string }; rx?: boolean; descripcion?: string;
}
export interface Sesion extends Base {
  fecha: string; lugar: Lugar; fuerza: Fuerza[]; metcon?: Metcon; nota?: string;
}
export interface Carrera extends Base {
  fecha: string; tipo?: string; distanciaKm: number; tiempoSeg: number; nota?: string; stravaId?: number;
  desnivelM?: number; fcMedia?: number;
}
export interface Datos { version: 1; ejercicios: Ejercicio[]; sesiones: Sesion[]; carreras: Carrera[] }
