import { render } from 'preact';
import { App } from './ui/App';
import { iniciar } from './store/estado';
import './estilos.css';

void iniciar();
render(<App />, document.getElementById('app')!);
