import { useEffect } from 'react'
import { useCallModeStore } from '../stores/callModeStore'
import SessionBar from '../components/callmode/SessionBar'
import LeadCard from '../components/callmode/LeadCard'
import PrepCard from '../components/callmode/PrepCard'
import ObjectionCards from '../components/callmode/ObjectionCards'
import QuickLog from '../components/callmode/QuickLog'
import { Phone, Loader2 } from 'lucide-react'

export default function CallMode() {
  const { loading, loadQueue, currentLead } = useCallModeStore()

  useEffect(() => {
    loadQueue()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" />
          <p className="text-gray-400">Loading call queue...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
          <Phone className="w-4 h-4 text-green-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Call Mode</h1>
          <p className="text-xs text-gray-500">AI-powered cold calling command center</p>
        </div>
      </div>

      {/* Session Bar */}
      <SessionBar />

      {/* Main Content */}
      {currentLead ? (
        <>
          <div className="grid grid-cols-5 gap-4 flex-1 min-h-0">
            {/* Left: Lead Info */}
            <div className="col-span-2">
              <LeadCard />
            </div>

            {/* Right: AI Prep */}
            <div className="col-span-3 space-y-4 overflow-y-auto">
              <PrepCard />
              <ObjectionCards />
            </div>
          </div>

          {/* Bottom: Quick Log */}
          <QuickLog />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Phone className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 text-lg">No leads in queue</p>
            <p className="text-gray-500 text-sm mt-1">Add leads via Lead Discovery to start calling</p>
          </div>
        </div>
      )}
    </div>
  )
}
