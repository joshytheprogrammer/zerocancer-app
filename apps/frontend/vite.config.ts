import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { resolve } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
  ],
  // test: {
  //   globals: true,
  //   environment: 'jsdom',
  // },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@zerocancer/shared': resolve(__dirname, '../../packages/shared'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target:
          process.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
    // proxy: {
    //   '/api/v1': 'http://localhost:8000',
    // },
  },
})
