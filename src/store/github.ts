import type { Datos } from '../domain/types';

export const URL_DATOS = 'https://api.github.com/repos/ichaoart-cmd/entrenos-data/contents/data/entrenos.json';

export class ErrorGitHub extends Error {
  constructor(public status: number) { super(`GitHub ${status}`); }
}

export function codificar(d: Datos): string {
  const bytes = new TextEncoder().encode(JSON.stringify(d, null, 2) + '\n');
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function decodificar(b64: string): Datos {
  const bin = atob(b64.replace(/\s/g, ''));
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))));
}

function cabeceras(token: string): HeadersInit {
  return { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json', 'Content-Type': 'application/json' };
}

export async function leerRemoto(token: string): Promise<{ datos: Datos; sha: string } | null> {
  const r = await fetch(URL_DATOS, { headers: cabeceras(token), cache: 'no-store' });
  if (r.status === 404) return null;
  if (!r.ok) throw new ErrorGitHub(r.status);
  const j = await r.json();
  return { datos: decodificar(j.content), sha: j.sha };
}

export async function escribirRemoto(token: string, datos: Datos, sha: string | undefined, mensaje: string): Promise<string> {
  const r = await fetch(URL_DATOS, {
    method: 'PUT',
    headers: cabeceras(token),
    body: JSON.stringify({ message: mensaje, content: codificar(datos), ...(sha ? { sha } : {}) }),
  });
  if (!r.ok) throw new ErrorGitHub(r.status);
  const j = await r.json();
  return j.content.sha;
}
