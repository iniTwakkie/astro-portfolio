import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  site: 'https://danienell.com',
  redirects: {
    '/status': 'https://kuma.danienell.com/status/nodes'
  }
});
