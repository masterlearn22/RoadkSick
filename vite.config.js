import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isHttps =
    process.env.npm_lifecycle_event === 'dev:mobile' ||
    process.env.npm_lifecycle_event === 'dev:https' ||
    process.env.HTTPS === 'true'

  return {
    base: './', // Mendukung deployment subpath seperti GitHub Pages (username.github.io/repo-name/)
    plugins: [react(), isHttps ? basicSsl() : null].filter(Boolean),
    server: {
      host: true, // Izinkan akses dari smartphone via IP WiFi lokal (0.0.0.0)
      port: 5173,
      allowedHosts: true, // Izinkan semua host/tunneling (localtunnel, ngrok, dsb)
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
        '/detect': {
          target: 'http://127.0.0.1:8000',
          changeOrigin: true,
        },
      },
    },
  }
})

