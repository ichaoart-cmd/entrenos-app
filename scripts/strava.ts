/**
 * Importa carreras de Strava al repo de datos. Lo ejecuta la GitHub Action de entrenos-data.
 *   descargar  → renueva el acceso (o canjea STRAVA_CODIGO), guarda el refresh token en strava/token.json
 *                y deja las actividades en $TMP_ACTIVIDADES.
 *   incorporar → añade las carreras nuevas a data/entrenos.json (sin red; se puede repetir tras un rebase).
 * Variables: DATOS (carpeta del repo de datos), STRAVA_CLIENT_ID, STRAVA_CLIENT_SECRET, STRAVA_CODIGO (opcional), TMP_ACTIVIDADES.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Datos } from '../src/domain/types';
import { incorporarStrava, type ActividadStrava } from '../src/domain/strava';
import { desdeCuando, descargarActividades, obtenerAcceso } from './strava/cliente';

const env = (k: string) => process.env[k]?.trim() || undefined;
const DATOS = env('DATOS') ?? '.';
const ARCHIVO = join(DATOS, 'data/entrenos.json');
const TOKEN = join(DATOS, 'strava/token.json');
const TMP = env('TMP_ACTIVIDADES') ?? '/tmp/actividades.json';
const resumen = (t: string) => { console.log(t); const s = env('GITHUB_STEP_SUMMARY'); if (s) appendFileSync(s, t + '\n'); };
const leerDatos = (): Datos => JSON.parse(readFileSync(ARCHIVO, 'utf8'));

async function descargar() {
  const clientId = env('STRAVA_CLIENT_ID'), secreto = env('STRAVA_CLIENT_SECRET');
  const refresco = existsSync(TOKEN) ? (JSON.parse(readFileSync(TOKEN, 'utf8')) as { refresh_token?: string }).refresh_token : undefined;
  // Se acepta la dirección entera (http://localhost/?state=&code=XXX&scope=…) o solo el código.
  const crudo = env('STRAVA_CODIGO');
  const codigo = crudo?.includes('code=') ? new URL(crudo.replace(/^[^?]*\?/, 'http://x/?')).searchParams.get('code') ?? undefined : crudo;
  if (!codigo && !refresco) {
    resumen('Strava aún no está conectado. Ejecuta esta acción a mano y pega la dirección de autorización.');
    return;
  }
  if (!clientId || !secreto) throw new Error('Faltan los secretos STRAVA_CLIENT_ID y STRAVA_CLIENT_SECRET en el repo.');
  const t = await obtenerAcceso(fetch, { clientId, secreto, codigo, refresco });
  mkdirSync(join(DATOS, 'strava'), { recursive: true });
  // El refresh token solo sirve junto al secreto, que vive en los secrets de GitHub.
  writeFileSync(TOKEN, JSON.stringify({ refresh_token: t.refresco }, null, 2) + '\n');
  const acts = await descargarActividades(fetch, t.acceso, desdeCuando(leerDatos()));
  writeFileSync(TMP, JSON.stringify(acts));
  console.log(`Strava: ${acts.length} actividades desde la última importación.`);
}

function incorporar() {
  const acts = JSON.parse(readFileSync(TMP, 'utf8')) as ActividadStrava[];
  const r = incorporarStrava(leerDatos(), acts, new Date().toISOString());
  if (r.nuevas) writeFileSync(ARCHIVO, JSON.stringify(r.datos, null, 2) + '\n');
  resumen(r.nuevas ? `🏃 ${r.nuevas} ${r.nuevas === 1 ? 'carrera nueva' : 'carreras nuevas'} de Strava.` : 'Sin carreras nuevas en Strava.');
}

const modo = process.argv[2];
(modo === 'descargar' ? descargar() : modo === 'incorporar' ? Promise.resolve(incorporar()) : Promise.reject(new Error('Uso: strava.ts descargar|incorporar')))
  .catch((e: Error) => { resumen(`❌ ${e.message}`); process.exit(1); });
