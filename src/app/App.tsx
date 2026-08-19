import { useEffect } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes, useNavigate } from "react-router"

import { TabLayout } from "@/components/Layout"
import { Toaster } from "@/components/ui/sonner"
import { ChunksScreen } from "@/screens/ChunksScreen"
import { HomeScreen } from "@/screens/HomeScreen"
import { LeaderboardScreen } from "@/screens/LeaderboardScreen"
import { LessonScreen } from "@/screens/LessonScreen"
import { ListenScreen } from "@/screens/ListenScreen"
import { NotFoundScreen } from "@/screens/NotFoundScreen"
import { ProfileScreen } from "@/screens/ProfileScreen"
import { QuizScreen } from "@/screens/QuizScreen"
import { ReadingScreen } from "@/screens/ReadingScreen"
import { RoomScreen } from "@/screens/RoomScreen"
import { RoomsScreen } from "@/screens/RoomsScreen"
import { SprintScreen } from "@/screens/SprintScreen"
import { WordsScreen } from "@/screens/WordsScreen"
import { getStartParam } from "@/lib/telegram"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

/**
 * Taklif havolasi bilan ochilgan bo'lsa, kerakli uyga o'tkazadi.
 *
 * Telegram `?startapp=room_xxx` qiymatini `start_param` sifatida beradi.
 * Bot tugmasi ilovani to'g'ridan-to'g'ri `/room/xxx` manzilida ochadi —
 * bu esa Mini App havolasi orqali kelgan holat uchun.
 */
function StartParamRouter() {
  const navigate = useNavigate()

  useEffect(() => {
    const code = /^room_([a-z0-9]{4,12})$/i.exec(getStartParam())?.[1]
    if (code && window.location.pathname === "/") {
      navigate(`/room/${code.toLowerCase()}`, { replace: true })
    }
  }, [navigate])

  return null
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <StartParamRouter />
      <Routes>
        <Route element={<TabLayout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/rooms" element={<RoomsScreen />} />
          <Route path="/rating" element={<LeaderboardScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>

        <Route path="/room/:code" element={<RoomScreen />} />

        <Route path="/lesson/:lessonId" element={<LessonScreen />} />
        <Route path="/lesson/:lessonId/listen" element={<ListenScreen />} />
        <Route path="/lesson/:lessonId/read" element={<ChunksScreen />} />
        <Route path="/lesson/:lessonId/read/:chunk" element={<ReadingScreen />} />
        <Route path="/lesson/:lessonId/words" element={<WordsScreen />} />
        <Route path="/lesson/:lessonId/sprint" element={<SprintScreen />} />
        <Route path="/lesson/:lessonId/quiz" element={<QuizScreen />} />

        <Route path="*" element={<NotFoundScreen />} />
      </Routes>
    </BrowserRouter>
    <Toaster position="top-center" richColors />
  </QueryClientProvider>
)

export default App
