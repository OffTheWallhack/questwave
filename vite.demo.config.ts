import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Demo build: jeden HTML súbor s vymyslenými dátami, bez Supabase.
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
    {
      // demo je jeden súbor bez ikon a manifestu
      name: 'strip-pwa',
      transformIndexHtml: (html) =>
        html
          .split('\n')
          .filter((l) => !/manifest|apple-touch-icon|favicon|og:image/.test(l))
          .join('\n'),
    },
  ],
  publicDir: false,
  build: { outDir: 'dist-demo' },
})
