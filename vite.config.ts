import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import devServer from '@hono/vite-dev-server'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // .env dagi SERVER tomon o'zgaruvchilari (OPENAI_API_KEY, MONGODB_URI, ...)
  // Vite ularni process.env ga o'zi qo'ymaydi — dev API uchun qo'lda yuklaymiz.
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''))

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Lokal `npm run dev` da /api/* so'rovlarini o'sha Hono ilovasi qabul qiladi,
      // Vercel'dagi bilan bir xil kod. Qolgan hamma yo'l Vite'ga o'tadi.
      devServer({
        entry: 'server/app.ts',
        exclude: [/^(?!\/api\/).*$/],
        injectClientScript: false,
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, './src'),
        '@shared': path.resolve(import.meta.dirname, './shared'),
      },
    },
    server: {
      port: 5173,
      // Telefonda Telegram orqali sinash uchun (ngrok/cloudflared)
      allowedHosts: true,
    },
  }
})
