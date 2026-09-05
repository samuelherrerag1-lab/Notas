import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    base: '/Notas/', // Ruta base para GitHub Pages (https://samuelherrerag1-lab.github.io/Notas/)
    plugins: [
        react(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
            scope: '/Notas/',
            manifest: {
                name: 'Notas Táctiles Apple - Chromebook Edition',
                short_name: 'Notas',
                description: 'Aplicación de notas táctiles de 60 FPS con anotación de PDF y soporte 100% offline para Chromebooks escolares.',
                theme_color: '#FCFCFD',
                background_color: '#FCFCFD',
                display: 'standalone',
                orientation: 'any',
                start_url: '/Notas/',
                scope: '/Notas/',
                icons: [
                    {
                        src: '/Notas/pwa-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                    {
                        src: '/Notas/pwa-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable',
                    },
                ],
            },
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg,wasm,json}'],
                maximumFileSizeToCacheInBytes: 20 * 1024 * 1024,
                runtimeCaching: [
                    {
                        urlPattern: function (_a) {
                            var request = _a.request;
                            return request.destination === 'document' ||
                                request.destination === 'script' ||
                                request.destination === 'style' ||
                                request.destination === 'image';
                        },
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'apple-notes-pwa-cache-v1',
                            expiration: {
                                maxEntries: 200,
                                maxAgeSeconds: 60 * 60 * 24 * 365,
                            },
                        },
                    },
                ],
            },
        }),
    ],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    server: {
        port: 5173,
        host: true,
    },
});
