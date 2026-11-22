import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { MetconForm } from '../../src/ui/MetconForm';
import { Registrar } from '../../src/ui/Registrar';
import { Progreso } from '../../src/ui/Progreso';
import { estado } from '../../src/store/estado';
import { reemplazarDatos } from '../../src/store/local';
import type { Datos, Metcon, Sesion } from '../../src/domain/types';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'red' })) }));

const franSes = (fecha: string, valor: string): Sesion => ({ id: fecha, actualizado: '2024-01-01T00:00:00Z', fecha, lugar: 'box', fuerza: [],
  metcon: { formato: 'ForTime', benchmark: 'fran', rx: true, resultado: { tipo: 'tiempo', valor } } });
async function con(sesiones: Sesion[]) {
  await clear();
  const d: Datos = { version: 1, ejercicios: [], sesiones, carreras: [] };
  await reemplazarDatos(d); estado.datos.value = d; estado.listo.value = true;
}

test('elegir un WOD de referencia rellena formato, descripción y movimientos, y enseña tu mejor marca', async () => {
  await con([franSes('2026-03-01', '5:40')]);
  let m: Metcon = { formato: 'AMRAP' };
  const { rerender } = render(<MetconForm metcon={m} onCambio={(x) => { m = x; }} onQuitar={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'WOD de referencia' }));
  fireEvent.click(screen.getByRole('button', { name: /^Fran/ }));
  expect(m).toMatchObject({ formato: 'ForTime', benchmark: 'fran', movimientos: ['thruster', 'dominadas'] });
  expect(m.descripcion).toMatch(/21-15-9/);
  rerender(<MetconForm metcon={m} onCambio={(x) => { m = x; }} onQuitar={() => {}} />);
  expect(screen.getByText(/Tu mejor: 5:40/)).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Thruster' }).getAttribute('aria-pressed')).toBe('true');
});

test('los movimientos se marcan y desmarcan', () => {
  let m: Metcon = { formato: 'AMRAP' };
  const { rerender } = render(<MetconForm metcon={m} onCambio={(x) => { m = x; }} onQuitar={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Box jump' }));
  expect(m.movimientos).toEqual(['box-jump']);
  rerender(<MetconForm metcon={m} onCambio={(x) => { m = x; }} onQuitar={() => {}} />);
  fireEvent.click(screen.getByRole('button', { name: 'Box jump' }));
  expect(m.movimientos).toBeUndefined();
});

test('al guardar un benchmark mejor, avisa del récord', async () => {
  await con([franSes('2026-03-01', '5:40')]);
  render(<Registrar />);
  fireEvent.click(screen.getByRole('button', { name: 'Quitar fuerza' }));
  fireEvent.click(screen.getByRole('button', { name: /Metcon/ }));
  fireEvent.click(screen.getByRole('button', { name: 'WOD de referencia' }));
  fireEvent.click(screen.getByRole('button', { name: /^Fran/ }));
  fireEvent.input(screen.getByLabelText('Tiempo (mm:ss)'), { target: { value: '5:10' } });
  fireEvent.click(screen.getByRole('button', { name: 'Guardar sesión' }));
  expect(await screen.findByText(/Fran: 5:10\. Más rápido que nunca/)).toBeTruthy();
});

test('Progreso → Metcons: mejor marca e historial de cada WOD de referencia', async () => {
  await con([franSes('2026-01-10', '6:12'), franSes('2026-03-01', '5:40')]);
  render(<Progreso ejercicio='metcon' />);
  expect(screen.getByRole('heading', { name: 'Metcons' })).toBeTruthy();
  const fran = screen.getByRole('region', { name: 'Fran' });
  expect(fran.textContent).toContain('5:40');
  expect(fran.textContent).toContain('6:12');
});

test('registrar con un WOD de referencia abre el Metcon ya rellenado y sin fuerza', async () => {
  await con([]);
  render(<Registrar wodInicial='cindy' />);
  expect(screen.queryByRole('button', { name: 'Quitar fuerza' })).toBeNull();
  expect(screen.getByText('Cindy')).toBeTruthy();
});
test('registrar solo Metcon', async () => {
  await con([]);
  render(<Registrar soloMetcon />);
  expect(screen.queryByRole('button', { name: 'Quitar fuerza' })).toBeNull();
  expect(screen.getByRole('button', { name: 'WOD de referencia' })).toBeTruthy();
});
