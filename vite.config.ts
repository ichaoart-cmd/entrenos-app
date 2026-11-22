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
          { src: 'icono-pop-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
