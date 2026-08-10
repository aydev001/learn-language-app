import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { BrowserRouter, Route, Routes } from "react-router"

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
import { SprintScreen } from "@/screens/SprintScreen"
import { WordsScreen } from "@/screens/WordsScreen"

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Routes>
        <Route element={<TabLayout />}>
          <Route path="/" element={<HomeScreen />} />
          <Route path="/rating" element={<LeaderboardScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
        </Route>

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
