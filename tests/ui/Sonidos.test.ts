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
});
