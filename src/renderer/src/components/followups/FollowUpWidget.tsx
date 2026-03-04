import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useFollowUpStore } from '../../stores/followUpStore'
import { Clock, AlertTriangle, Phone, Mail, CheckCircle, SkipForward } from 'lucide-react'

export default function FollowUpWidget() {
  const { dueToday, overdue, loading, load, complete, skip } = useFollowUpStore()
  const navigate = useNavigate()

  useEffect(() => { load() }, [])

  const allDue = [...overdue, ...dueToday.filter((d) => !overdue.find((o) => o.id === d.id))]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
          <Clock className="w-4 h-4" /> Follow-Ups
        </h3>
        {overdue.length > 0 && (
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full animate-pulse">
            {overdue.length} overdue
          </span>
        )}
      </div>

      {loading ? (
        <p className="text-gray-500 text-sm">Loading...</p>
      ) : allDue.length === 0 ? (
        <p className="text-gray-500 text-sm">No follow-ups due. You're all caught up!</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {allDue.slice(0, 8).map((fu) => {
            const isOverdue = overdue.some((o) => o.id === fu.id)
            return (
              <div key={fu.id} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                isOverdue ? 'bg-red-500/5 border border-red-500/20' : 'bg-navy-800'
              }`}>
                {fu.type === 'call' ? (
                  <Phone className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                ) : (
                  <Mail className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                )}
                <div
                  className="flex-1 min-w-0 cursor-pointer hover:text-gold transition-colors"
                  onClick={() => navigate(`/business/${fu.lead_id}`)}
                >
                  <p className="text-gray-300 truncate">{fu.lead_name || 'Unknown'}</p>
                  {isOverdue && (
                    <p className="text-xs text-red-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" /> Overdue
                    </p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => complete(fu.id)} className="p-1 hover:bg-green-500/20 rounded" title="Complete">
                    <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                  </button>
                  <button onClick={() => skip(fu.id)} className="p-1 hover:bg-gray-500/20 rounded" title="Skip">
                    <SkipForward className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
