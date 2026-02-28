import { useEffect, useState } from 'react'

export default function CampaignStats() {
  const [stats, setStats] = useState({ total_sent: 0, responses: 0, pending: 0, response_rate: 0 })

  useEffect(() => {
    window.api.outreach.getStats().then((s: any) => setStats(s))
  }, [])

  if (stats.total_sent === 0) return null

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Campaign Performance</h3>
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-navy-950 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-white">{stats.total_sent}</p>
          <p className="text-xs text-gray-500">Messages Sent</p>
        </div>
        <div className="bg-navy-950 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-green-400">{stats.responses}</p>
          <p className="text-xs text-gray-500">Responses</p>
        </div>
        <div className="bg-navy-950 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-gold">{stats.response_rate}%</p>
          <p className="text-xs text-gray-500">Response Rate</p>
        </div>
        <div className="bg-navy-950 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-yellow-400">{stats.pending}</p>
          <p className="text-xs text-gray-500">Awaiting Reply</p>
        </div>
      </div>
    </div>
  )
}
