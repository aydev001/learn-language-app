import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initTelegram } from '@/lib/telegram'

// Mavzu va oyna o'lchamini React ishga tushishidan oldin sozlaymiz —
// shunda birinchi kadrdayoq to'g'ri ranglar chiqadi.
initTelegram()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
