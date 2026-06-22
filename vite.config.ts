import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/fifa26/',
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'https://worldcupjson.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        secure: true,
      },
    },
  },
});
