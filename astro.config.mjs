import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  site: 'https://danienell.com',
  redirects: {
    '/status': 'https://kuma.danienell.com/status/nodes'
  },
  vite: {
    plugins: [tailwindcss()]
  }
});
