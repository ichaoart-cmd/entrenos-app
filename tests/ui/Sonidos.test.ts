import { sonidoPara } from '../../src/ui/sonido';

const el = (html: string) => { document.body.innerHTML = html; return document.body.firstElementChild!.querySelector('[data-t]') ?? document.body.firstElementChild!; };

test('cada tipo de pulsación tiene su sonido', () => {
  expect(sonidoPara(el(`<button aria-label="Subir Reps">+</button>`))).toBe('subir');
  expect(sonidoPara(el(`<button aria-label="Bajar Reps">−</button>`))).toBe('bajar');
  expect(sonidoPara(el(`<button aria-pressed="false">Box</button>`))).toBe('activar');
  expect(sonidoPara(el(`<button aria-pressed="true">Box</button>`))).toBe('desactivar');
  expect(sonidoPara(el(`<button role="switch" aria-checked="false">x</button>`))).toBe('activar');
  expect(sonidoPara(el(`<nav class="barra"><a data-t href="#/">Inicio</a></nav>`))).toBe('pestana');
  expect(sonidoPara(el(`<button class="peligro-lleno">Sí, borrar</button>`))).toBe('borrar');
  expect(sonidoPara(el(`<button class="primario">Guardar</button>`))).toBe('principal');
  expect(sonidoPara(el(`<button>Otro</button>`))).toBe('tecla');
  expect(sonidoPara(el(`<button><span data-t>+30</span></button>`))).toBe('tecla');
  expect(sonidoPara(el(`<div>nada</div>`))).toBeNull();
  // Tarjetas, días del calendario y avisos son enlaces, pero no botones: no suenan.
  expect(sonidoPara(el(`<a class="tarjeta ultima" href="#/registrar?id=a">Lo último</a>`))).toBeNull();
  expect(sonidoPara(el(`<a class="cal-dia" href="#/registrar?fecha=x">3</a>`))).toBeNull();
  expect(sonidoPara(el(`<ul class="destacado"><li><a data-t href="#/progreso">aviso</a></li></ul>`))).toBeNull();
  // Los enlaces con pinta de botón sí.
  expect(sonidoPara(el(`<a class="accion" href="#/carrera">Carrera</a>`))).toBe('tecla');
  expect(sonidoPara(el(`<a class="hero-ej" href="#/registrar?ej=x">Banca</a>`))).toBe('tecla');
});

test('suena al pulsar (click), no al empezar a tocar para hacer scroll', async () => {
  const { activarClics } = await import('../../src/ui/sonido');
  const vib = vi.fn(); Object.defineProperty(navigator, 'vibrate', { value: vib, configurable: true });
  localStorage.clear();
  activarClics();
  document.body.innerHTML = '<button id="b">Hola</button>';
  const b = document.getElementById('b')!;
  b.dispatchEvent(new Event('pointerdown', { bubbles: true }));
  expect(vib).not.toHaveBeenCalled();
  b.click();
  expect(vib).toHaveBeenCalledTimes(1);
});
