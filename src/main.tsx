import { render } from 'preact';
import { App } from './ui/App';
import { iniciar } from './store/estado';
import '@fontsource-variable/archivo/wdth.css';
import '@fontsource-variable/fraunces';
import './estilos.css';

void iniciar();
render(<App />, document.getElementById('app')!);
