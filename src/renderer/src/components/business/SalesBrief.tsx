import { useState, useEffect } from 'react'
import type { Lead } from '../../types/lead'

interface IntelResult {
  brief: string
  talking_points: string[]
  pain_points: string[]
  suggested_approach: string
  competitive_angle: string
}

export default function SalesBrief({ lead }: { lead: Lead }) {
  const [intel, setIntel] = useState<IntelResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Check for cached intel on mount
    window.api.intel.get(lead.id).then((cached: IntelResult | null) => {
      if (cached) setIntel(cached)
    })
  }, [lead.id])

  const generate = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.intel.generate(lead.id, {
        name: lead.name,
        phone: lead.phone,
        website: lead.website,
        has_website: lead.has_website,
        address: lead.address,
        rating: lead.rating,
        rating_count: lead.rating_count,
        types: lead.types,
        notes: lead.notes
      })
      setIntel(result as IntelResult)
    } catch (err) {
      setError((err as Error).message)
    }
    setLoading(false)
  }

  const refresh = async () => {
    await window.api.intel.clear(lead.id)
    setIntel(null)
    generate()
  }

  if (!intel && !loading) {
    return (
      <div className="card border-navy-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Sales Intelligence</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          AI-powered research to arm you for the sales conversation.
        </p>
        <button onClick={generate} className="btn-gold text-sm w-full">
          Research This Lead
        </button>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card border-navy-700">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Sales Intelligence</h3>
        <div className="flex items-center gap-2 text-sm text-gold">
          <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          Researching {lead.name}...
        </div>
      </div>
    )
  }

  return (
    <div className="card border-gold/20 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gold uppercase tracking-wider">Sales Intelligence</h3>
        <button onClick={refresh} className="text-xs text-gray-500 hover:text-gray-300">Refresh</button>
      </div>

      {/* Brief */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Overview</p>
        <p className="text-sm text-gray-300 leading-relaxed">{intel!.brief}</p>
      </div>

      {/* Talking Points */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Talking Points</p>
        <div className="space-y-1.5">
          {intel!.talking_points.map((tp, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-gold text-xs mt-0.5">&#x25B6;</span>
              <p className="text-sm text-gray-300">{tp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pain Points */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Pain Points</p>
        <div className="space-y-1.5">
          {intel!.pain_points.map((pp, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-red-400 text-xs mt-0.5">&#x26A0;</span>
              <p className="text-sm text-gray-300">{pp}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Approach */}
      <div>
        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Suggested Approach</p>
        <p className="text-sm text-gray-300 leading-relaxed">{intel!.suggested_approach}</p>
      </div>

      {/* Competitive Angle */}
      {intel!.competitive_angle && (
        <div className="bg-gold/5 border border-gold/20 rounded-lg p-3">
          <p className="text-xs text-gold uppercase tracking-wider mb-1">Your Edge</p>
          <p className="text-sm text-gray-300">{intel!.competitive_angle}</p>
        </div>
      )}
    </div>
  )
}
