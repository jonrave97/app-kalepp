import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
  	alias: {
  		'@': path.resolve(__dirname, 'src'),
  		'@hooks': path.resolve(__dirname, 'src/hooks'),
  		'@types' : path.resolve(__dirname,'src/types'),
  		'@context': path.resolve(__dirname,'src/context'),
		'@components': path.resolve(__dirname,'src/components'),

  	}
  },
  server: {
    open: 'brave'
  }
})
