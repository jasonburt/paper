import { defineConfig, type Plugin } from 'vite';

// SPA fallback plugin — serves index.html for all non-file, non-API routes
function spaFallback(): Plugin {
  return {
    name: 'spa-fallback',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url && !req.url.startsWith('/api') && !req.url.includes('.')) {
          req.url = '/index.html';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  plugins: [spaFallback()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3011',
    },
  },
});
