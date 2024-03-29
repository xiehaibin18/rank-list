import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from "vite-plugin-singlefile"
import { copy, emptyDir } from 'fs-extra'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const targetDir = resolve(__dirname, '../chat-openai-proxy/views/dRank')

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), viteSingleFile()],
  build: {
    rollupOptions: {
      plugins: [
        {
          name: 'copy-files-after-build',
          writeBundle() {
            const distDir = resolve(dirname(fileURLToPath(import.meta.url)), './dist')
            emptyDir(targetDir)
              .then(() => copy(distDir, targetDir))
              .then(() => console.log('复制成功'))
              .catch((err) => console.error('复制失败', err))
          }
        }
      ]
    },
  },
  test: {
    // browser: {
    //   enabled: true,
    //   name: 'chrome', // browser name is required
    // },
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    environment: 'jsdom',
    reporters: ['default', 'html']
  }
})
