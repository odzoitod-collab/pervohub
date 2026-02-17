import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = { ...loadEnv(mode, '.', ''), ...process.env } as Record<string, string>;
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['logo.svg'],
          manifest: {
            name: 'PervozHub — соціальна мережа Первозванівського ліцею',
            short_name: 'PervozHub',
            description: 'Шкільна соціальна мережа для учнів, вчителів та батьків. Пости, ідеї, бюро знахідок, розклад дзвінків та події.',
            start_url: '/',
            display: 'standalone',
            background_color: '#fafafa',
            theme_color: '#0095f6',
            orientation: 'portrait-primary',
            scope: '/',
            lang: 'uk',
            icons: [
              { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
              { src: '/logo.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' }
            ]
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.SUPABASE_URL': JSON.stringify(env.SUPABASE_URL || ''),
        'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify(env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
