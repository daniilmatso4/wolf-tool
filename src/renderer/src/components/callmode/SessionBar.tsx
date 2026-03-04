import { useState, useEffect } from 'react'
import { useCallModeStore } from '../../stores/callModeStore'
import { Phone, PhoneOff, Clock, Zap, Calendar, CheckCircle } from 'lucide-react'

export default function SessionBar() {
  const { session, powerHourActive, powerHourEndTime, startSession, endSession } = useCallModeStore()
  const [timeLeft, setTimeLeft] = useState('')
  const [elapsed, setElapsed] = useState('')

  useEffect(() => {
    if (!session) return
    const interval = setInterval(() => {
      if (powerHourActive && powerHourEndTime) {
        const remaining = Math.max(0, powerHourEndTime - Date.now())
        const mins = Math.floor(remaining / 60000)
        const secs = Math.floor((remaining % 60000) / 1000)
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`)
        if (remaining <= 0) {
          endSession()
        }
      } else {
        const start = new Date(session.started_at).getTime()
        const diff = Date.now() - start
        const mins = Math.floor(diff / 60000)
        const secs = Math.floor((diff % 60000) / 1000)
        setElapsed(`${mins}:${secs.toString().padStart(2, '0')}`)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [session, powerHourActive, powerHourEndTime])

  if (!session) {
    return (
      <div className="bg-navy-800 border border-navy-600 rounded-xl p-4 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">Start a Calling Session</h2>
          <p className="text-sm text-gray-400">Track your calls and earn XP</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => startSession('normal')} className="btn-gold flex items-center gap-2">
            <Phone className="w-4 h-4" /> Start Session
          </button>
          <button onClick={() => startSession('power_hour')} className="btn-outline flex items-center gap-2 border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
            <Zap className="w-4 h-4" /> Power Hour (2x XP)
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl p-4 flex items-center justify-between ${
      powerHourActive
        ? 'bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30'
        : 'bg-navy-800 border border-navy-600'
    }`}>
      <div className="flex items-center gap-6">
        {powerHourActive ? (
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-400 animate-pulse" />
            <div>
              <p className="text-orange-400 font-bold text-lg">{timeLeft}</p>
              <p className="text-xs text-orange-400/60">POWER HOUR</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gray-400" />
            <div>
              <p className="text-white font-bold text-lg">{elapsed}</p>
              <p className="text-xs text-gray-500">Session time</p>
            </div>
          </div>
        )}

        <div className="h-8 w-px bg-navy-600" />

        <div className="flex items-center gap-4">
          <Stat label="Calls" value={session.calls_made} icon={<Phone className="w-4 h-4 text-blue-400" />} />
          <Stat label="Answered" value={session.calls_answered} icon={<CheckCircle className="w-4 h-4 text-green-400" />} />
          <Stat label="Meetings" value={session.meetings_booked} icon={<Calendar className="w-4 h-4 text-gold" />} />
        </div>
      </div>

      <button onClick={endSession} className="btn-ghost text-red-400 hover:bg-red-500/10 flex items-center gap-2">
        <PhoneOff className="w-4 h-4" /> End Session
      </button>
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-white font-bold">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}
