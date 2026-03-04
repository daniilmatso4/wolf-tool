import { useState, useEffect } from 'react'
import { useFollowUpStore } from '../../stores/followUpStore'
import type { CadenceTemplate } from '../../types/followup'
import { Calendar, Zap } from 'lucide-react'

interface Props {
  leadId: string
  onScheduled?: () => void
  onCancel?: () => void
}

export default function FollowUpScheduler({ leadId, onScheduled, onCancel }: Props) {
  const { cadences, loadCadences, schedule, scheduleFromCadence } = useFollowUpStore()
  const [mode, setMode] = useState<'manual' | 'cadence'>('manual')
  const [dueDate, setDueDate] = useState('')
  const [type, setType] = useState<'call' | 'email'>('call')
  const [selectedCadence, setSelectedCadence] = useState('')

  useEffect(() => { loadCadences() }, [])

  const handleManualSchedule = async () => {
    if (!dueDate) return
    await schedule({ lead_id: leadId, type, due_date: dueDate })
    onScheduled?.()
  }

  const handleCadenceSchedule = async () => {
    if (!selectedCadence) return
    await scheduleFromCadence(leadId, selectedCadence)
    onScheduled?.()
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <button
          onClick={() => setMode('manual')}
          className={`px-3 py-1.5 rounded text-sm ${mode === 'manual' ? 'bg-gold/20 text-gold' : 'bg-navy-800 text-gray-400'}`}
        >
          <Calendar className="w-3 h-3 inline mr-1" /> Manual
        </button>
        <button
          onClick={() => setMode('cadence')}
          className={`px-3 py-1.5 rounded text-sm ${mode === 'cadence' ? 'bg-gold/20 text-gold' : 'bg-navy-800 text-gray-400'}`}
        >
          <Zap className="w-3 h-3 inline mr-1" /> Cadence
        </button>
      </div>

      {mode === 'manual' ? (
        <div className="flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value as any)} className="input-field">
            <option value="call">Call</option>
            <option value="email">Email</option>
          </select>
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input-field flex-1" />
          <button onClick={handleManualSchedule} className="btn-gold text-sm" disabled={!dueDate}>Schedule</button>
          {onCancel && <button onClick={onCancel} className="btn-ghost text-sm">Cancel</button>}
        </div>
      ) : (
        <div className="flex gap-2">
          <select
            value={selectedCadence}
            onChange={(e) => setSelectedCadence(e.target.value)}
            className="input-field flex-1"
          >
            <option value="">Select cadence...</option>
            {cadences.map((c: CadenceTemplate) => (
              <option key={c.id} value={c.id}>{c.name} ({c.steps.length} steps)</option>
            ))}
          </select>
          <button onClick={handleCadenceSchedule} className="btn-gold text-sm" disabled={!selectedCadence}>Apply</button>
          {onCancel && <button onClick={onCancel} className="btn-ghost text-sm">Cancel</button>}
        </div>
      )}
    </div>
  )
}
