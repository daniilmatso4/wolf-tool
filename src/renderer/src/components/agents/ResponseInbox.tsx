import { useEffect, useState } from 'react'

interface OutreachItem {
  id: string
  prospect_name: string
  prospect_title: string
  prospect_company: string
  prospect_profile_url: string
  message: string
  sent_at: string
  response_detected: number
  response_snippet: string | null
  response_detected_at: string | null
  read: number
}

export default function ResponseInbox() {
  const [responses, setResponses] = useState<OutreachItem[]>([])
  const [pending, setPending] = useState<OutreachItem[]>([])
  const [stats, setStats] = useState({ total_sent: 0, responses: 0, pending: 0, response_rate: 0 })
  const [monitorRunning, setMonitorRunning] = useState(false)
  const [tab, setTab] = useState<'responses' | 'pending'>('responses')

  const load = async () => {
    const [r, p, s, m] = await Promise.all([
      window.api.outreach.getResponses(),
      window.api.outreach.getPending(),
      window.api.outreach.getStats(),
      window.api.monitor.status()
    ])
    setResponses(r as OutreachItem[])
    setPending(p as OutreachItem[])
    setStats(s as typeof stats)
    setMonitorRunning(m.running)
  }

  useEffect(() => {
    load()
    const cleanup = window.api.monitor.onResponse(() => {
      load() // Refresh when new response detected
    })
    return cleanup
  }, [])

  const toggleMonitor = async () => {
    if (monitorRunning) {
      await window.api.monitor.stop()
    } else {
      await window.api.monitor.start()
    }
    setMonitorRunning(!monitorRunning)
  }

  const markRead = async (id: string) => {
    await window.api.outreach.markRead(id)
    setResponses((prev) => prev.map((r) => r.id === id ? { ...r, read: 1 } : r))
  }

  const unreadCount = responses.filter((r) => !r.read).length

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="card border-navy-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Outreach Tracker</h3>
          <button
            onClick={toggleMonitor}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium ${
              monitorRunning
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-navy-800 text-gray-400 border border-navy-600'
            }`}
          >
            {monitorRunning ? 'Monitor Active' : 'Start Monitor'}
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-navy-950 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-white">{stats.total_sent}</p>
            <p className="text-xs text-gray-500">Sent</p>
          </div>
          <div className="bg-navy-950 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.responses}</p>
            <p className="text-xs text-gray-500">Responses</p>
          </div>
          <div className="bg-navy-950 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-gray-500">Awaiting</p>
          </div>
          <div className="bg-navy-950 rounded-lg p-3 text-center">
            <p className="text-2xl font-bold text-gold">{stats.response_rate}%</p>
            <p className="text-xs text-gray-500">Rate</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('responses')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'responses' ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-navy-800 text-gray-400'
          }`}
        >
          Responses {unreadCount > 0 && <span className="ml-1 bg-gold text-navy-950 px-1.5 rounded-full text-xs">{unreadCount}</span>}
        </button>
        <button
          onClick={() => setTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium ${
            tab === 'pending' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-navy-800 text-gray-400'
          }`}
        >
          Pending ({pending.length})
        </button>
      </div>

      {/* Response List */}
      {tab === 'responses' && (
        <div className="space-y-2">
          {responses.length === 0 ? (
            <div className="card text-center text-gray-500 text-sm py-8">
              No responses yet. {!monitorRunning && 'Start the monitor to detect replies.'}
            </div>
          ) : (
            responses.map((r) => (
              <div
                key={r.id}
                onClick={() => !r.read && markRead(r.id)}
                className={`card cursor-pointer transition-all ${
                  !r.read ? 'border-gold/40 bg-gold/5' : 'border-navy-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {!r.read && <div className="w-2 h-2 rounded-full bg-gold" />}
                      <span className="font-semibold text-white text-sm">{r.prospect_name}</span>
                      {r.prospect_company && <span className="text-xs text-gray-500">at {r.prospect_company}</span>}
                    </div>
                    {r.response_snippet && (
                      <p className="text-sm text-gray-300 mt-1 line-clamp-2">{r.response_snippet}</p>
                    )}
                    <p className="text-xs text-gray-600 mt-1">
                      Replied {r.response_detected_at ? new Date(r.response_detected_at).toLocaleString() : ''}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pending List */}
      {tab === 'pending' && (
        <div className="space-y-2">
          {pending.length === 0 ? (
            <div className="card text-center text-gray-500 text-sm py-8">
              No pending outreach. Deploy agents to start prospecting.
            </div>
          ) : (
            pending.map((p) => (
              <div key={p.id} className="card border-navy-700">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-white">{p.prospect_name}</span>
                    {p.prospect_company && <span className="text-xs text-gray-500 ml-2">at {p.prospect_company}</span>}
                  </div>
                  <span className="text-xs text-gray-600">{new Date(p.sent_at).toLocaleDateString()}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 line-clamp-1">{p.message}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
