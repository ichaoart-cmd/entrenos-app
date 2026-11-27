import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { RegistrarCarrera } from '../../src/ui/RegistrarCarrera';
import { Registrar } from '../../src/ui/Registrar';
import { Calendario } from '../../src/ui/Calendario';
import { Inicio } from '../../src/ui/Inicio';
import { estado } from '../../src/store/estado';
import { cargarLocal, reemplazarDatos } from '../../src/store/local';
import type { Carrera, Datos } from '../../src/domain/types';
import { sesion } from '../fixtures/sesiones';
import { hoy } from '../../src/ui/Registrar';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

const run = (id: string, fecha: string, extra: Partial<Carrera> = {}): Carrera =>
  ({ id, actualizado: '2024-01-01T00:00:00Z', fecha, distanciaKm: 8, tiempoSeg: 2530, ...extra });
async function con(d: Partial<Datos>) {
  await clear();
  const datos: Datos = { version: 1, ejercicios: [], sesiones: [], carreras: [], ...d };
  await reemplazarDatos(datos);
  estado.datos.value = datos;
}

test('carrera: esfuerzo, FC media y desnivel se guardan; en blanco no se guardan', async () => {
  await con({});
  render(<RegistrarCarrera />);
  fireEvent.click(screen.getByRole('button', { name: 'Duro' }));
  fireEvent.input(screen.getByLabelText('FC media'), { target: { value: '152' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar carrera' }));
  await waitFor(async () => {
    const c = (await cargarLocal()).carreras[0];
    expect(c).toMatchObject({ esfuerzo: 3, fcMedia: 152 });
    expect(c).not.toHaveProperty('desnivelM');
  });
});

test('borrar una carrera desde su pantalla pide confirmación', async () => {
  const c = run('x', '2026-11-20');
  await con({ carreras: [c] });
  render(<RegistrarCarrera carreraInicial={c} />);
  fireEvent.click(screen.getByRole('button', { name: 'Borrar carrera' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));
  await waitFor(async () => expect((await cargarLocal()).carreras[0].borrado).toBe(true));
});

test('una carrera nueva no tiene botón de borrar', async () => {
  await con({});
  render(<RegistrarCarrera />);
  expect(screen.queryByRole('button', { name: 'Borrar carrera' })).toBeNull();
});

test('borrar una sesión desde su pantalla', async () => {
  const s = sesion('s1', '2026-11-20', 'back-squat', 5, [90]);
  await con({ sesiones: [s] });
  render(<Registrar sesionInicial={s} />);
  fireEvent.click(screen.getByRole('button', { name: 'Borrar sesión' }));
  fireEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));
  await waitFor(async () => expect((await cargarLocal()).sesiones[0].borrado).toBe(true));
});

test('el calendario dice el tipo de entreno de cada día y tiene leyenda', () => {
  const h = hoy();
  render(<Calendario sesiones={[sesion('a', h, 'snatch', 3, [60], { metcon: { formato: 'AMRAP' } })]} carreras={[run('c', h)]} minSemana={3} />);
  expect(screen.getByRole('button', { name: new RegExp(`^${Number(h.slice(8))} · .*Halterofilia, Metcon, Carrera`) })).toBeTruthy();
  for (const t of ['Pierna', 'Torso', 'Halterofilia', 'Calistenia', 'Metcon', 'Carrera']) expect(screen.getByText(t, { selector: '.cal-leyenda *' })).toBeTruthy();
});

test('Inicio muestra lo destacado bajo el calendario', async () => {
  await con({ sesiones: [sesion('a', '2026-01-01', 'deadlift', 5, [120])] });
  render(<Inicio />);
  expect(screen.getByRole('heading', { name: 'Lo que se cuece' })).toBeTruthy();
  expect(screen.getByText(/Peso muerto te echa de menos/)).toBeTruthy();
});
