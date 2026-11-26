import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => mode === 'vista-previa' ? {
  base: './',
  plugins: [preact()],
  build: { outDir: 'dist-vista-previa', rollupOptions: { input: 'vista-previa.html' } },
} : {
  base: '/entrenos-app/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,woff2,png,svg,webp}'] },
      manifest: {
        name: 'Entrenos',
        short_name: 'Entrenos',
        lang: 'es',
        display: 'standalone',
        theme_color: '#faf3e3',
        description: 'Registro de entrenamientos de CrossFit y carrera',
        background_color: '#faf3e3',
        start_url: '/entrenos-app/',
        icons: [
          { src: 'icono-pop-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icono-pop-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icono-pop-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Accesos directos al mantener pulsado el icono (Android muestra hasta 4).
        shortcuts: [
          { name: 'Registrar fuerza', short_name: 'Fuerza', url: '/entrenos-app/#/registrar', icons: [{ src: 'atajo-fuerza.png', sizes: '96x96', type: 'image/png' }] },
          { name: 'Apuntar carrera', short_name: 'Carrera', url: '/entrenos-app/#/carrera', icons: [{ src: 'atajo-carrera.png', sizes: '96x96', type: 'image/png' }] },
          { name: 'Apuntar peso', short_name: 'Peso', url: '/entrenos-app/#/progreso?ej=peso', icons: [{ src: 'atajo-peso.png', sizes: '96x96', type: 'image/png' }] },
          { name: 'Calculadora de discos', short_name: 'Discos', url: '/entrenos-app/#/discos', icons: [{ src: 'atajo-discos.png', sizes: '96x96', type: 'image/png' }] },
        ],
      },
    }),
  ],
});
