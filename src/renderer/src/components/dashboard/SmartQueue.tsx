import { useLeadsStore } from '../../stores/leadsStore'
import { useNavigate } from 'react-router-dom'
import type { Lead } from '../../types/lead'

function scoreLead(lead: Lead): { score: number; reason: string } {
  let score = 0
  let reason = ''

  // High priority leads get big boost
  if (lead.priority === 'high') { score += 30; reason = 'High priority' }
  else if (lead.priority === 'medium') score += 15

  // Leads without websites are core targets
  if (!lead.has_website) { score += 20; reason = reason || 'No website - perfect target' }

  // Status-based scoring
  if (lead.status === 'interested') { score += 25; reason = reason || 'Interested - close the deal' }
  else if (lead.status === 'contacted') { score += 15; reason = reason || 'Contacted - follow up' }
  else if (lead.status === 'new') { score += 10; reason = reason || 'New lead - make first contact' }

  // High-rated businesses are better targets
  if (lead.rating && lead.rating >= 4.0) score += 10
  if (lead.rating_count && lead.rating_count >= 50) score += 5

  // Stale leads need attention (contacted more than 3 days ago)
  const daysSinceUpdate = Math.floor((Date.now() - new Date(lead.updated_at).getTime()) / 86400000)
  if (lead.status === 'contacted' && daysSinceUpdate >= 3) {
    score += 15
    reason = `Follow up - ${daysSinceUpdate} days since last contact`
  }
  if (lead.status === 'interested' && daysSinceUpdate >= 2) {
    score += 20
    reason = `Hot lead going cold - ${daysSinceUpdate} days idle`
  }

  return { score, reason: reason || 'Review lead' }
}

export default function SmartQueue() {
  const leads = useLeadsStore((s) => s.leads)
  const navigate = useNavigate()

  // Only include actionable leads (not clients or not-interested)
  const actionable = leads.filter((l) => !['client', 'not_interested'].includes(l.status))

  const scored = actionable
    .map((lead) => ({ lead, ...scoreLead(lead) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  if (scored.length === 0) return null

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Today's Priority Queue</h3>
      <div className="space-y-2">
        {scored.map(({ lead, score, reason }, i) => (
          <div
            key={lead.id}
            onClick={() => navigate(`/business/${lead.id}`)}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-navy-700 cursor-pointer transition-colors"
          >
            <span className={`text-sm font-bold w-6 text-center ${i === 0 ? 'text-gold' : i < 3 ? 'text-gray-300' : 'text-gray-500'}`}>
              {i + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{lead.name}</p>
              <p className="text-xs text-gray-500">{reason}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded ${
                lead.status === 'interested' ? 'bg-status-interested/20 text-green-400' :
                lead.status === 'contacted' ? 'bg-status-contacted/20 text-blue-400' :
                'bg-status-new/20 text-purple-400'
              }`}>
                {lead.status}
              </span>
              <div className={`w-1.5 h-6 rounded-full ${
                score >= 40 ? 'bg-gold' : score >= 25 ? 'bg-yellow-500' : 'bg-gray-600'
              }`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
