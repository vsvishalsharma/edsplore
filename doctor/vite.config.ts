import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'buffer',
      'process',
      'util',
      'events',
      'stream-browserify',
      'readable-stream',
      'string_decoder'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
  resolve: {
    alias: {
      crypto: resolve(__dirname, 'node_modules/crypto-browserify'),
      stream: resolve(__dirname, 'node_modules/stream-browserify'),
      buffer: resolve(__dirname, 'node_modules/buffer'),
      process: resolve(__dirname, 'node_modules/process/browser.js'),
      util: resolve(__dirname, 'node_modules/util'),
      events: resolve(__dirname, 'node_modules/events'),
      path: resolve(__dirname, 'node_modules/path-browserify'),
      querystring: resolve(__dirname, 'node_modules/querystring-es3'),
      'readable-stream': resolve(__dirname, 'node_modules/readable-stream'),
      string_decoder: resolve(__dirname, 'node_modules/string_decoder')
    }
  },
  define: {
    'process.env': {},
    global: 'globalThis'
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
});