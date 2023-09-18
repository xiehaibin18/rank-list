import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue(), viteSingleFile()],
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
