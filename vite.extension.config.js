import { fileURLToPath, URL } from "node:url"
import { defineConfig } from "vite"
import vue from "@vitejs/plugin-vue"
import { cpSync, mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const root = fileURLToPath(new URL(".", import.meta.url))
const outDir = join(root, "dist-extension")

function copyExtensionAssets() {
  return {
    name: "copy-extension-assets",
    closeBundle() {
      mkdirSync(outDir, { recursive: true })
      cpSync(join(root, "extension/manifest.json"), join(outDir, "manifest.json"))
      cpSync(join(root, "extension/background.js"), join(outDir, "background.js"))
      const favicon = join(root, "public/favicon.ico")
      if (existsSync(favicon)) {
        cpSync(favicon, join(outDir, "favicon.ico"))
      }
      const indexPath = join(outDir, "index.html")
      if (existsSync(indexPath)) {
        writeFileSync(indexPath, readFileSync(indexPath, "utf8"))
      }
    },
  }
}

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'simple-chat',
        },
      },
    }),
    copyExtensionAssets(),
  ],
  base: "./",
  define: {
    "import.meta.env.VITE_EXTENSION": JSON.stringify("true"),
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist-extension",
    emptyOutDir: true,
    sourcemap: false,
  },
})
