import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/entrenos-app/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: { globPatterns: ['**/*.{js,css,html,woff2,png,svg}'] },
      manifest: {
        name: 'Entrenos',
        short_name: 'Entrenos',
        lang: 'es',
        display: 'standalone',
        theme_color: '#2f3d2e',
        description: 'Registro de entrenamientos de CrossFit y carrera',
        background_color: '#eee8dd',
        start_url: '/entrenos-app/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
    }),
  ],
});
