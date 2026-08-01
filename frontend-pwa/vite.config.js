import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

// https://vitejs.dev/config/
export default defineConfig({
  envDir: repoRoot,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'splash/*.png', 'city-packs/top-cities.v1.json'],
      manifest: {
        id: '/',
        name: 'Mframapa Air Quality',
        short_name: 'Mframapa',
        description: 'Daily air quality estimates and episode alerts for African cities. Free for everyone, works offline.',
        theme_color: '#06080d',
        background_color: '#06080d',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        display_override: ['standalone', 'minimal-ui'],
        orientation: 'portrait-primary',
        categories: ['health', 'weather', 'utilities'],
        lang: 'en',
        dir: 'ltr',
        prefer_related_applications: false,
        icons: [
          { src: 'icons/icon-72.png',  sizes: '72x72',   type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-96.png',  sizes: '96x96',   type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-144.png', sizes: '144x144', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-152.png', sizes: '152x152', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        screenshots: [
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', form_factor: 'narrow' }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      workbox: {
        // Bump when shipping visual parity so installed PWAs drop stale caches.
        cacheId: 'mframapa-pwa-v1.0.2',
        // Web Push handlers (push + notificationclick) live beside the generated SW.
        importScripts: ['/sw-push.js'],
        globPatterns: ['**/*.{css,html,ico,woff2}', 'assets/index-*.js'],
        // never precache these; they are fetched on demand and cached below
        globIgnores: ['**/mapbox-gl-*.js', '**/assets/{af,am,ar,ee,es,fr,ga,ha,ig,mg,nd,ny,pt,rn,rw,sn,so,ss,st,sw,ti,tn,tw,wo,xh,yo,zu}-*.js'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/city-packs\/.*\.json$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'city-pack-cache',
              expiration: {
                maxEntries: 8,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              // Must stay above axios predict timeout; cold upstreams exceed 10s.
              networkTimeoutSeconds: 40,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 6 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            // the map and locale chunks, cached the first time they are used
            urlPattern: /\/assets\/.*\.js$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-chunks',
              expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'mapbox-api-cache',
              expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ],
  server: {
    // dev proxy: relative /api calls go to the deployed backend (same-origin to the
    // browser, so no cors in dev). override with VITE_DEV_API_TARGET for a local api.
    proxy: {
      '/api': {
        target: process.env.VITE_DEV_API_TARGET || 'https://api.mframapa.live',
        changeOrigin: true,
        secure: true,
      }
    }
  }
})
