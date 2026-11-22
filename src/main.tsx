import { render } from 'preact';
import { App } from './ui/App';
import { activarClics } from './ui/sonido';
import { iniciarNavegacion } from './ui/navegacion';
import { iniciar } from './store/estado';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource/space-mono/400.css';
import '@fontsource/space-mono/700.css';
import './estilos.css';
import './tema-pop.css';

void iniciar();
activarClics();
iniciarNavegacion();
render(<App />, document.getElementById('app')!);
