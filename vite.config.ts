import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('/firebase/auth')) {
              return 'firebase-auth';
            }
            if (id.includes('/firebase/firestore')) {
              return 'firebase-firestore';
            }
            if (id.includes('/firebase/')) {
              return 'firebase-core';
            }
            if (id.includes('/react-dom/') || (id.includes('/react/') && !id.includes('react-easy-crop'))) {
              return 'react-vendor';
            }
            if (id.includes('/lucide-react/')) {
              return 'icons';
            }
            if (id.includes('/motion/')) {
              return 'motion';
            }
            if (id.includes('/date-fns/')) {
              return 'date-fns';
            }
            if (id.includes('/react-easy-crop/')) {
              return 'crop';
            }
          }
        },
      },
    },
  },
});
