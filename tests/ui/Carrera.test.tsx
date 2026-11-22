import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { RegistrarCarrera } from '../../src/ui/RegistrarCarrera';
import { Historial } from '../../src/ui/Historial';
import { Progreso } from '../../src/ui/Progreso';
import { estado } from '../../src/store/estado';
import { cargarLocal, reemplazarDatos } from '../../src/store/local';
import type { Carrera, Datos } from '../../src/domain/types';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

const run = (id: string, fecha: string, km: number, seg: number, extra: Partial<Carrera> = {}): Carrera =>
  ({ id, actualizado: '2024-01-01T00:00:00Z', fecha, distanciaKm: km, tiempoSeg: seg, ...extra });

async function con(d: Partial<Datos>) {
  await clear();
  const datos: Datos = { version: 1, ejercicios: [], sesiones: [], carreras: [], ...d };
  await reemplazarDatos(datos);
  estado.datos.value = datos;
}

test('registrar una carrera calcula el ritmo y la guarda', async () => {
  await con({});
  render(<RegistrarCarrera />);
  fireEvent.input(screen.getByLabelText('Distancia (km)'), { target: { value: '8' } });
  fireEvent.input(screen.getByLabelText('Horas'), { target: { value: '0' } });
  fireEvent.input(screen.getByLabelText('Minutos'), { target: { value: '42' } });
  fireEvent.input(screen.getByLabelText('Segundos'), { target: { value: '10' } });
  expect(screen.getByText('5:16')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Series' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar carrera' }));
  await waitFor(async () => {
    const c = (await cargarLocal()).carreras;
    expect(c).toHaveLength(1);
    expect(c[0]).toMatchObject({ distanciaKm: 8, tiempoSeg: 2530, tipo: 'series' });
  });
});

test('avisa de una mejor marca en una distancia', async () => {
  await con({ carreras: [run('a', '2026-10-01', 5, 1600)] });
  render(<RegistrarCarrera />);
  fireEvent.input(screen.getByLabelText('Distancia (km)'), { target: { value: '5' } });
  fireEvent.input(screen.getByLabelText('Horas'), { target: { value: '0' } });
  fireEvent.input(screen.getByLabelText('Minutos'), { target: { value: '25' } });
  fireEvent.input(screen.getByLabelText('Segundos'), { target: { value: '0' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar carrera' }));
  expect(await screen.findByText(/Mejor 5 km: 25:00/)).toBeTruthy();
});

test('una carrera importada de Strava muestra su origen y conserva el stravaId al editar', async () => {
  const c = run('strava-9', '2026-11-20', 8.03, 2530, { stravaId: 9, desnivelM: 41, fcMedia: 151 });
  await con({ carreras: [c] });
  render(<RegistrarCarrera carreraInicial={c} />);
  expect(screen.getByText(/De Strava/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Tirada larga' }));
  fireEvent.click(screen.getByRole('button', { name: 'Guardar carrera' }));
  await waitFor(async () => expect((await cargarLocal()).carreras[0]).toMatchObject({ id: 'strava-9', stravaId: 9, tipo: 'tirada larga' }));
});

test('el historial mezcla carreras y sesiones y deja borrar una carrera', async () => {
  await con({ sesiones: [sesion('s', '2026-11-10', 'back-squat', 5, [90])], carreras: [run('c', '2026-11-12', 8, 2530)] });
  render(<Historial />);
  const items = screen.getAllByRole('listitem').map((li) => li.textContent);
  expect(items[0]).toContain('8 km');
  expect(items[0]).toContain('5:16 /km');
  fireEvent.click(screen.getAllByRole('button', { name: 'Borrar' })[0]);
  fireEvent.click(screen.getByRole('button', { name: 'Sí, borrar' }));
  await waitFor(async () => expect((await cargarLocal()).carreras[0].borrado).toBe(true));
});

test('progreso de fuerza: filtro con / sin tempo', async () => {
  await con({ sesiones: [
    sesion('1', '2026-09-01', 'back-squat', 5, [100], { fuerza: [{ ejercicio: 'back-squat', reps: 5, series: [100], tempo: 'sin tempo' }] }),
    sesion('2', '2026-10-01', 'back-squat', 5, [80], { fuerza: [{ ejercicio: 'back-squat', reps: 5, series: [80], tempo: '4s+pausa' }] }),
  ] });
  render(<Progreso ejercicio='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: 'Ver datos' }));
  expect(screen.getAllByRole('row')).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Con tempo' }));
  expect(screen.getAllByRole('row')).toHaveLength(2);
  expect(screen.getByRole('row', { name: /80 kg/ })).toBeTruthy();
});

test('progreso de carrera: km por semana, mejores marcas y predicción', async () => {
  const h = new Date().toISOString().slice(0, 10);
  await con({ carreras: [run('a', h, 5, 1500), run('b', h, 10.05, 3200)] });
  render(<Progreso ejercicio='carrera' />);
  expect(screen.getByRole('heading', { name: 'Carrera' })).toBeTruthy();
  expect(screen.getByText('Km por semana')).toBeTruthy();
  expect(screen.getByText('Mejores marcas')).toBeTruthy();
  expect(screen.getByText('Predicción')).toBeTruthy();
});
