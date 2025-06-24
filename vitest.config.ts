import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    // setupFiles: './test/setup.ts', // Commented out - using Jest syntax
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
})