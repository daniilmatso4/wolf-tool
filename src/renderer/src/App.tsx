import { HashRouter, Routes, Route } from 'react-router-dom'
import { useEffect } from 'react'
import MainLayout from './components/layout/MainLayout'
import ErrorBoundary from './components/shared/ErrorBoundary'
import Dashboard from './pages/Dashboard'
import LeadDiscovery from './pages/LeadDiscovery'
import Pipeline from './pages/Pipeline'
import BusinessDetail from './pages/BusinessDetail'
import Achievements from './pages/Achievements'
import Settings from './pages/Settings'
import AIAgents from './pages/AIAgents'
import Login from './pages/Login'
import { useSettingsStore } from './stores/settingsStore'
import { useLeadsStore } from './stores/leadsStore'
import { useGamificationStore } from './stores/gamificationStore'
import { useAuthStore } from './stores/authStore'
import LevelUpModal from './components/gamification/LevelUpModal'
import AchievementToast from './components/gamification/AchievementToast'
import XPNotification from './components/gamification/XPNotification'

function AuthenticatedApp() {
  const loadSettings = useSettingsStore((s) => s.load)
  const loadLeads = useLeadsStore((s) => s.load)
  const loadGamification = useGamificationStore((s) => s.load)

  useEffect(() => {
    loadSettings()
    loadLeads()
    loadGamification()
  }, [])

  return (
    <HashRouter>
      <MainLayout>
        <ErrorBoundary>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/discover" element={<LeadDiscovery />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/business/:id" element={<BusinessDetail />} />
            <Route path="/agents" element={<AIAgents />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </ErrorBoundary>
      </MainLayout>
      <LevelUpModal />
      <AchievementToast />
      <XPNotification />
    </HashRouter>
  )
}

export default function App() {
  const { user, loading, restoreSession } = useAuthStore()

  useEffect(() => {
    restoreSession()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4 animate-pulse">🐺</div>
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <ErrorBoundary>
        <Login />
      </ErrorBoundary>
    )
  }

  return (
    <ErrorBoundary>
      <AuthenticatedApp />
    </ErrorBoundary>
  )
}
