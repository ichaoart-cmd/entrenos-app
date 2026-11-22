import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Registrar } from '../../src/ui/Registrar';
import { Inicio } from '../../src/ui/Inicio';
import { estado } from '../../src/store/estado';
import { cargarLocal } from '../../src/store/local';
import { sesion } from '../fixtures/sesiones';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));
const datosCon = (sesiones: any[]) => ({ version: 1 as const, ejercicios: [], sesiones, carreras: [] });
const valores = () => screen.getAllByLabelText(/^Serie \d$/).map((i) => (i as HTMLInputElement).value);
beforeEach(async () => { await clear(); localStorage.clear(); estado.datos.value = datosCon([sesion('b', '2026-06-18', 'back-squat', 5, [74, 79, 84, 89, 94])]); });


test('se puede escribir el peso de cada serie con decimales', async () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.input(screen.getByLabelText('Serie 1'), { target: { value: '72,5' } });
  fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
  await waitFor(async () => expect((await cargarLocal()).sesiones.find((s) => s.id !== 'b')?.fuerza[0].series[0]).toBe(72.5));
});




test('Hoy toca ofrece elegir otro ejercicio', () => {
  render(<Inicio />);
  expect(screen.getByRole('link', { name: 'Otro ejercicio' }).getAttribute('href')).toBe('#/registrar?elegir=1');
});

test('registrar con elegir abre el catálogo', () => {
  render(<Registrar abrirSelector />);
  expect(screen.getByRole('searchbox', { name: 'Buscar ejercicio' })).toBeTruthy();
});

test('cada serie puede llevar sus propias repeticiones', async () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: 'Subir Reps serie 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Reps serie 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Reps serie 1' }));
  fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
  await waitFor(async () => {
    const f = (await cargarLocal()).sesiones.find((s) => s.id !== 'b')!.fuerza[0];
    expect(f.repsSeries).toEqual([8, 5, 5, 5, 5]);
    expect(f.reps).toBe(5);
  });
});


test('cada serie muestra su objetivo y lo real empieza igual', () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  expect(screen.getByText('Objetivo 89 × 5')).toBeTruthy();
  expect(valores()).toEqual(['74', '79', '84', '89', '94']);
});

test('quedarse corto en la última serie la marca y se guardan objetivo y real', async () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: 'Bajar Reps serie 5' }));
  fireEvent.click(screen.getByRole('button', { name: 'Bajar Reps serie 5' }));
  expect(screen.getByText('No alcanzado')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Guardar/ }));
  await waitFor(async () => {
    const f = (await cargarLocal()).sesiones.find((x) => x.id !== 'b')!.fuerza[0];
    expect(f.repsSeries).toEqual([5, 5, 5, 5, 3]);
    expect(f.reps).toBe(3);
    expect(f.objetivo).toEqual({ series: [74, 79, 84, 89, 94], reps: [5, 5, 5, 5, 5] });
  });
});

test('cambiar el objetivo no pisa las series ya ajustadas', () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: 'Bajar Serie 5' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Serie top (kg)' }));
  fireEvent.click(screen.getByRole('button', { name: 'Subir Serie top (kg)' }));
  expect(valores()).toEqual(['75', '80', '85', '90', '93']);
  expect(screen.getByText('Objetivo 95 × 5')).toBeTruthy();
});

test('las reps generales cambian el objetivo de todas y lo real de las no tocadas', () => {
  render(<Registrar ejercicioInicial='back-squat' />);
  fireEvent.click(screen.getByRole('button', { name: 'Subir Reps serie 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Bajar Reps' }));
  expect(screen.getAllByLabelText(/^Reps serie \d$/).map((i) => (i as HTMLInputElement).value)).toEqual(['6', '4', '4', '4', '4']);
});

test('al editar una sesión antigua sin objetivo, el objetivo es lo que se hizo', () => {
  render(<Registrar sesionInicial={estado.datos.value.sesiones[0]} />);
  expect(screen.getByText('Objetivo 94 × 5')).toBeTruthy();
  expect(screen.queryByText('No alcanzado')).toBeNull();
});

test('botón «Repetir la última vez» copia la última sesión de ese ejercicio', async () => {
  const { render: r, screen: sc, fireEvent: fe } = await import('@testing-library/preact');
  const { FuerzaForm } = await import('../../src/ui/FuerzaForm');
  const { sesion } = await import('../fixtures/sesiones');
  const ses = [sesion('a', '2026-11-01', 'press-banca', 6, [50, 55, 60, 65])];
  const cambio = vi.fn();
  r(<FuerzaForm fuerza={{ ejercicio: 'press-banca', reps: 5, series: [52, 57, 62, 67, 72] }} onCambio={cambio} ejercicios={[]} sesiones={ses} onQuitar={() => {}} />);
  fe.click(sc.getByRole('button', { name: /Repetir la última vez/ }));
  expect(cambio).toHaveBeenLastCalledWith(expect.objectContaining({ series: [50, 55, 60, 65], reps: 6, objetivo: { series: [50, 55, 60, 65], reps: [6, 6, 6, 6] } }));
});
