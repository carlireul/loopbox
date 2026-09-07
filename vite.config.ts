/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

const crossOriginIsolation = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // `prompt` + our own <UpdatePrompt> toast (via virtual:pwa-register/react).
      registerType: 'prompt',
      // The app registers the SW through the React hook, so don't also inject
      // the auto-register script (that would register it twice).
      injectRegister: false,
      includeAssets: [
        'favicon.ico',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
      ],
      manifest: {
        name: 'loopbox',
        short_name: 'loopbox',
        description:
          'A free, beginner friendly groovebox for electronic music production.',
        theme_color: '#74C0FC',
        background_color: '#ffffff',
        icons: [
          {
            src: '/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,wav,mp3,jpg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        // ffmpeg's core wasm is ~32 MB and export is online-only by design,
        // so keep it out of the precache (well above Workbox's default cap).
        globIgnores: ['**/ffmpeg-core*'],
      },
      devOptions: {
        enabled: true,
        navigateFallback: 'index.html',
        type: 'module',
      },
    }),
  ],
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  // ffmpeg.wasm audio export needs cross-origin isolation (SharedArrayBuffer).
  // Apply the same headers in dev and `preview`; production sets them in
  // vercel.json. All external subresources are self-hosted, so require-corp
  // has nothing to block.
  server: { headers: crossOriginIsolation },
  preview: { headers: crossOriginIsolation },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    },
  },
});
