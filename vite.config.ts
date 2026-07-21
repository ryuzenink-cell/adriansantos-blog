import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Atualiza o service worker automaticamente quando há nova versão.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      // Assets estáticos extras que entram no precache.
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'icons/icon-192.png',
        'icons/icon-512.png',
      ],
      // Gera dist/manifest.webmanifest e injeta o <link rel="manifest">.
      manifest: {
        name: 'Adrian Santos Blog',
        short_name: 'Adrian Blog',
        description: 'Personal blog and portfolio of Adrian Santos.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f7f3eb',
        theme_color: '#f7f3eb',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache apenas assets estáticos do build.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest,woff2}'],
        // SPA fallback para navegação offline...
        navigateFallback: '/index.html',
        // ...EXCETO API/admin/arquivos de SEO/posts: nunca servir o shell
        // cacheado para essas rotas (dados sensíveis vêm de /api e jamais são
        // cacheados; sitemap/robots precisam do conteúdo real, não do
        // index.html; /posts/:slug é renderizado no servidor pela Pages
        // Function e precisa sempre ir à rede, nunca ao shell da SPA em cache).
        navigateFallbackDenylist: [
          /^\/api\//,
          /^\/admin/,
          /^\/sitemap\.xml$/,
          /^\/robots\.txt$/,
          /^\/posts\//,
        ],
        // Sem runtimeCaching para /api: chamadas sempre vão à rede.
        cleanupOutdatedCaches: true,
      },
      devOptions: {
        // PWA desligado no `vite dev`; teste via build + preview / wrangler.
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
