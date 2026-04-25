// src/App.jsx
import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { SidebarProvider } from './context/SidebarContext'
import ProtectedRoute from './components/ProtectedRoute'
import Sidebar from './components/Sidebar'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ArenaDetail from './pages/ArenaDetail'
import WeeklyReport from './pages/WeeklyReport'
import MonthlyTracker from './pages/MonthlyTracker'
import HabitTracker from './pages/HabitTracker'
import Journal from './pages/Journal'
import OKRs from './pages/OKRs'
import NotFound from './pages/NotFound'

function WeeklyReportRoute() {
  const { weekDate } = useParams()
  return (
    <ProtectedRoute>
      <WeeklyReport key={weekDate ?? 'current'} />
    </ProtectedRoute>
  )
}

function AppLayout({ children }) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden lg:ml-[220px] min-w-0">
          {children}
        </div>
      </div>
    </SidebarProvider>
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
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-peak-sidebar text-white text-xs font-medium px-4 py-2 rounded-full shadow-lg">
            You're offline — showing cached data
          </div>
        )}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/arena/:slug" element={<ProtectedRoute><AppLayout><ArenaDetail /></AppLayout></ProtectedRoute>} />
          <Route path="/report" element={<AppLayout><WeeklyReportRoute /></AppLayout>} />
          <Route path="/report/:weekDate" element={<AppLayout><WeeklyReportRoute /></AppLayout>} />
          <Route path="/month" element={<ProtectedRoute><AppLayout><MonthlyTracker /></AppLayout></ProtectedRoute>} />
          <Route path="/habits" element={<ProtectedRoute><AppLayout><HabitTracker /></AppLayout></ProtectedRoute>} />
          <Route path="/journal" element={<ProtectedRoute><AppLayout><Journal /></AppLayout></ProtectedRoute>} />
          <Route path="/okrs" element={<ProtectedRoute><AppLayout><OKRs /></AppLayout></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
