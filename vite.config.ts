import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'
import { fileURLToPath } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  build: {
    rolldownOptions: {
      input: {
        doppel: fileURLToPath(new URL('./index.html', import.meta.url)),
        keycard: fileURLToPath(new URL('./keycard/index.html', import.meta.url)),
      },
    },
  },
})
