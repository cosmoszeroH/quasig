/// <reference types="vitest/config" />

import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'quasig',
      fileName: 'quasig',
      formats: ['es', 'cjs'],
    },
  },
  test: {
    include: [
      './test',
      './**/*.{test,spec}.ts',
    ]
  },
})