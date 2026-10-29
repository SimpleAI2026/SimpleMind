import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'node:path'

const simpleChatRoot = fileURLToPath(new URL('../SimpleChat/packages', import.meta.url))

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'simple-chat',
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@simplechat/core': resolve(simpleChatRoot, 'core/dist/index.js'),
      '@simplechat/element': resolve(simpleChatRoot, 'element/dist/index.js'),
      '@simplechat/element/style.css': resolve(simpleChatRoot, 'element/dist/style.css'),
      '@simplechat/vue': resolve(simpleChatRoot, 'vue/dist/index.js'),
    },
  },
  optimizeDeps: {
    include: ['@simplechat/core', '@simplechat/element', '@simplechat/vue'],
  },
})
