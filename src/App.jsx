import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ArenaDetail from './pages/ArenaDetail'
import WeeklyReport from './pages/WeeklyReport'
import MonthlyTracker from './pages/MonthlyTracker'
import HabitTracker from './pages/HabitTracker'
import Journal from './pages/Journal'

// Wrapper that forces a fresh WeeklyReport mount whenever the week param changes
function WeeklyReportRoute() {
  const { weekDate } = useParams()
  return (
    <ProtectedRoute>
      <WeeklyReport key={weekDate ?? 'current'} />
    </ProtectedRoute>
  )
}

export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline  = () => setIsOffline(false)
    window.addEventListener('offline', goOffline)
    window.addEventListener('online',  goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online',  goOnline)
    }
  }, [])

  return (
    <BrowserRouter>
      <AuthProvider>
        {isOffline && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-peak-elevated border border-peak-border text-peak-primary text-xs font-medium px-4 py-2 rounded-full shadow-lg">
            You're offline — showing cached data
          </div>
        )}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/arena/:slug" element={<ProtectedRoute><ArenaDetail /></ProtectedRoute>} />
          <Route path="/report" element={<WeeklyReportRoute />} />
          <Route path="/report/:weekDate" element={<WeeklyReportRoute />} />
          <Route path="/month" element={<ProtectedRoute><MonthlyTracker /></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><HabitTracker /></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><Journal /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
