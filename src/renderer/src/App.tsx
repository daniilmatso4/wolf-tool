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
import CallMode from './pages/CallMode'
import MyProduct from './pages/MyProduct'
import Playbook from './pages/Playbook'
import Analytics from './pages/Analytics'
import Login from './pages/Login'
import { useSettingsStore } from './stores/settingsStore'
import { useLeadsStore } from './stores/leadsStore'
import { useGamificationStore } from './stores/gamificationStore'
import { useAuthStore } from './stores/authStore'
import { useProductStore } from './stores/productStore'
import WolfLogo from './components/icons/WolfLogo'
import LevelUpModal from './components/gamification/LevelUpModal'
import AchievementToast from './components/gamification/AchievementToast'
import XPNotification from './components/gamification/XPNotification'

function AuthenticatedApp() {
  const loadSettings = useSettingsStore((s) => s.load)
  const loadLeads = useLeadsStore((s) => s.load)
  const loadGamification = useGamificationStore((s) => s.load)
  const loadProduct = useProductStore((s) => s.load)

  useEffect(() => {
    loadSettings()
    loadLeads()
    loadGamification()
    loadProduct()
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
            <Route path="/call-mode" element={<CallMode />} />
            <Route path="/agents" element={<AIAgents />} />
            <Route path="/playbook" element={<Playbook />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/achievements" element={<Achievements />} />
            <Route path="/my-product" element={<MyProduct />} />
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
          <WolfLogo size={48} className="text-gold animate-pulse mx-auto mb-4" />
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
