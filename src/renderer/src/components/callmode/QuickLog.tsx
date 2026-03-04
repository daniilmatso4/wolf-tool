import { useState } from 'react'
import { useCallModeStore } from '../../stores/callModeStore'
import { useGamificationStore } from '../../stores/gamificationStore'
import type { CallOutcome } from '../../types/callmode'
import { ThumbsUp, PhoneMissed, ThumbsDown, Calendar, Save } from 'lucide-react'

const OUTCOMES: { key: CallOutcome; label: string; icon: typeof ThumbsUp; color: string }[] = [
  { key: 'positive', label: 'Positive', icon: ThumbsUp, color: 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20' },
  { key: 'no_answer', label: 'No Answer', icon: PhoneMissed, color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20' },
  { key: 'not_interested', label: 'Not Interested', icon: ThumbsDown, color: 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20' },
  { key: 'meeting_booked', label: 'Meeting Booked', icon: Calendar, color: 'bg-gold/10 border-gold/30 text-gold hover:bg-gold/20' }
]

export default function QuickLog() {
  const { currentLead, logOutcome, powerHourActive } = useCallModeStore()
  const gamificationLogActivity = useGamificationStore((s) => s.logActivity)
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome | null>(null)
  const [notes, setNotes] = useState('')
  const [followUpDate, setFollowUpDate] = useState('')
  const [saving, setSaving] = useState(false)

  if (!currentLead) return null

  const handleSave = async () => {
    if (!selectedOutcome) return
    setSaving(true)
    try {
      await logOutcome(selectedOutcome, notes || undefined, followUpDate || undefined)
      // Log XP (call activity). Power hour 2x is handled by gamification store awareness
      await gamificationLogActivity('call')
      if (selectedOutcome === 'meeting_booked') {
        await gamificationLogActivity('meeting')
      }
      // Reset form
      setSelectedOutcome(null)
      setNotes('')
      setFollowUpDate('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="bg-navy-800 border border-navy-600 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Quick Log</h3>
        {powerHourActive && <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded">2x XP</span>}
      </div>

      {/* Outcome buttons */}
      <div className="flex gap-2">
        {OUTCOMES.map((o) => {
          const Icon = o.icon
          return (
            <button
              key={o.key}
              onClick={() => setSelectedOutcome(o.key)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border text-sm transition-all ${
                selectedOutcome === o.key
                  ? o.color + ' ring-1 ring-current'
                  : 'bg-navy-900 border-navy-600 text-gray-400 hover:border-navy-500'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden xl:inline">{o.label}</span>
            </button>
          )
        })}
      </div>

      {/* Notes + Follow-up + Save */}
      <div className="flex gap-3">
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Notes (optional)"
          className="input-field flex-1"
          onKeyDown={(e) => { if (e.key === 'Enter' && selectedOutcome) handleSave() }}
        />
        <input
          type="date"
          value={followUpDate}
          onChange={(e) => setFollowUpDate(e.target.value)}
          className="input-field w-40"
        />
        <button
          onClick={handleSave}
          disabled={!selectedOutcome || saving}
          className="btn-gold flex items-center gap-2 disabled:opacity-30"
        >
          <Save className="w-4 h-4" />
          {saving ? '...' : 'Save & Next'}
        </button>
      </div>
    </div>
  )
}
