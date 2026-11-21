import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/entrenos-app/',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Entrenos',
        short_name: 'Entrenos',
        lang: 'es',
        display: 'standalone',
        theme_color: '#111111',
        background_color: '#111111',
        start_url: '/entrenos-app/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
});
