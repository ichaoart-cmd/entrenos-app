import { render, screen, fireEvent, waitFor } from '@testing-library/preact';
import { clear } from 'idb-keyval';
import { Bienvenida, debeVerBienvenida } from '../../src/ui/Bienvenida';
import { Ajustes } from '../../src/ui/Ajustes';
import { Opinion, mensajeOpinion } from '../../src/ui/Opinion';
import { Inicio } from '../../src/ui/Inicio';
import { estado } from '../../src/store/estado';
import { cargarLocal, reemplazarDatos } from '../../src/store/local';
import { importarCopia } from '../../src/domain/exportar';
import { textoSync } from '../../src/ui/formato';
import { sesion } from '../fixtures/sesiones';
import type { Datos } from '../../src/domain/types';

vi.mock('../../src/store/sync', () => ({ sincronizar: vi.fn(async () => ({ ok: false, motivo: 'sin-token' })) }));
const vacio = (): Datos => ({ version: 1, ejercicios: [], sesiones: [], carreras: [] });
beforeEach(async () => { await clear(); localStorage.clear(); estado.datos.value = vacio(); estado.ajustes.value = { pendiente: false, minSesionesSemana: 3 }; });

test('la bienvenida sale la primera vez a quien no tiene datos ni token', () => {
  expect(debeVerBienvenida(vacio(), {})).toBe(true);
  expect(debeVerBienvenida({ ...vacio(), sesiones: [sesion('a', '2026-01-01', 'snatch', 3, [40])] }, {})).toBe(false);
  expect(debeVerBienvenida(vacio(), { token: 't' })).toBe(false);
  localStorage.setItem('bienvenida-vista', '1');
  expect(debeVerBienvenida(vacio(), {})).toBe(false);
});

test('la bienvenida explica dónde están los datos y cómo instalarla, y se cierra para siempre', () => {
  const cerrar = vi.fn();
  render(<Bienvenida onCerrar={cerrar} />);
  const d = screen.getByRole('dialog', { name: 'Bienvenida' });
  expect(d.textContent).toMatch(/solo en este móvil/);
  expect(d.textContent).toMatch(/Instalar/);
  fireEvent.click(screen.getByRole('button', { name: /Vamos/ }));
  expect(localStorage.getItem('bienvenida-vista')).toBe('1');
  expect(cerrar).toHaveBeenCalled();
});

test('sin token, el estado dice que está guardado en el móvil, sin alarmas', () => {
  expect(textoSync('ok', { ok: false, motivo: 'sin-token' })).toBe('Guardado en este móvil ✓');
});

test('importar una copia suma los entrenos a los que ya hay', () => {
  const actual: Datos = { ...vacio(), sesiones: [sesion('a', '2026-01-01', 'snatch', 3, [40])] };
  const copia = JSON.stringify({ ...vacio(), sesiones: [sesion('b', '2026-01-02', 'clean', 3, [60])], carreras: [] });
  expect(importarCopia(actual, copia).sesiones.map((s) => s.id)).toEqual(['a', 'b']);
  expect(() => importarCopia(actual, '{"hola":1}')).toThrow(/no es una copia/);
});

test('Ajustes: la sincronización con GitHub queda como opción avanzada y hay importar copia', () => {
  render(<Ajustes />);
  expect(screen.getByText('Sincronizar con GitHub (avanzado)').closest('details')!.open).toBe(false);
  expect(screen.getByLabelText('Importar copia')).toBeTruthy();
});

test('opinión: arma un mensaje con las respuestas para enviarlo por WhatsApp', () => {
  const m = mensajeOpinion({ nota: 4, gusta: 'Los sonidos', cambia: 'Más ejercicios', usaria: 'Sí', pagaria: '1-2 €/mes' }, { sesiones: 7 });
  expect(m).toContain('4/5'); expect(m).toContain('Los sonidos'); expect(m).toContain('1-2 €/mes'); expect(m).toContain('7');
  render(<Opinion />);
  fireEvent.click(screen.getByRole('button', { name: '5' }));
  fireEvent.input(screen.getByLabelText('¿Qué te ha gustado?'), { target: { value: 'Todo' } });
  const a = screen.getByRole('link', { name: /Enviar por WhatsApp/ });
  expect(a.getAttribute('href')).toMatch(/^https:\/\/wa\.me\/\?text=/);
  expect(decodeURIComponent(a.getAttribute('href')!)).toContain('Todo');
});

test('Inicio enseña que es una beta y enlaza a dar la opinión', () => {
  render(<Inicio />);
  expect(screen.getByRole('link', { name: /Beta/ }).getAttribute('href')).toBe('#/opinion');
});
