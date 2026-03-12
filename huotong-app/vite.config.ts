import { cpSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig, type PluginOption } from 'vite'
import vue from '@vitejs/plugin-vue'

function spaFallbackPlugin(): PluginOption {
  return {
    name: 'spa-fallback-html',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist')
      const indexHtml = resolve(distDir, 'index.html')
      const notFoundHtml = resolve(distDir, '404.html')
      if (existsSync(indexHtml)) {
        cpSync(indexHtml, notFoundHtml)
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), spaFallbackPlugin()],
})
