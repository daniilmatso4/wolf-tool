import { useState, useEffect } from 'react'
import type { Lead } from '../../types/lead'

interface OwnerResult {
  owner_name: string | null
  owner_title: string | null
  owner_phone: string | null
  owner_email: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
}

const confidenceColors: Record<string, string> = {
  high: 'bg-green-500/20 text-green-400 border-green-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  low: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  none: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
}

export default function OwnerCard({ lead, onOwnerFound }: { lead: Lead; onOwnerFound?: (owner: OwnerResult) => void }) {
  const [owner, setOwner] = useState<OwnerResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    window.api.owner.get(lead.id).then((cached: OwnerResult | null) => {
      if (cached) setOwner(cached)
    })
  }, [lead.id])

  const discover = async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await window.api.owner.discover(lead.id, {
        name: lead.name,
        phone: lead.phone,
        website: lead.website,
        has_website: lead.has_website,
        address: lead.address,
        types: lead.types
      })
      setOwner(result as OwnerResult)
      if (onOwnerFound) onOwnerFound(result as OwnerResult)
    } catch (err) {
      setError((err as Error).message)
    }
    setLoading(false)
  }

  const refresh = async () => {
    await window.api.owner.clear(lead.id)
    setOwner(null)
    discover()
  }

  if (!owner && !loading) {
    return (
      <div className="card border-navy-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Decision Maker</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Find the owner or key decision-maker for this business.
        </p>
        <button onClick={discover} className="btn-gold text-sm w-full">
          Find Owner
        </button>
        {error && <p className="text-xs text-red-400 mt-2">{error}</p>}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="card border-navy-700">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Decision Maker</h3>
        <div className="flex items-center gap-2 text-sm text-gold">
          <div className="w-4 h-4 border-2 border-gold border-t-transparent rounded-full animate-spin" />
          Searching for owner...
        </div>
        <p className="text-xs text-gray-500 mt-2">Crawling website pages &amp; analyzing with AI...</p>
      </div>
    )
  }

  const hasOwnerInfo = owner!.owner_name || owner!.owner_email || owner!.owner_phone

  if (!hasOwnerInfo) {
    return (
      <div className="card border-navy-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Decision Maker</h3>
          <button onClick={refresh} className="text-xs text-gray-500 hover:text-gray-300">Retry</button>
        </div>
        <p className="text-sm text-gray-500">Could not identify owner from website content.</p>
      </div>
    )
  }

  return (
    <div className="card border-gold/20 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gold uppercase tracking-wider">Decision Maker</h3>
        <button onClick={refresh} className="text-xs text-gray-500 hover:text-gray-300">Refresh</button>
      </div>

      {/* Name & Title */}
      {owner!.owner_name && (
        <div>
          <p className="text-white font-semibold">{owner!.owner_name}</p>
          {owner!.owner_title && <p className="text-sm text-gray-400">{owner!.owner_title}</p>}
        </div>
      )}

      {/* Direct Phone */}
      {owner!.owner_phone && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase w-16">Phone</span>
          <a href={`tel:${owner!.owner_phone}`} className="text-sm text-gold hover:underline">
            {owner!.owner_phone}
          </a>
        </div>
      )}

      {/* Email */}
      {owner!.owner_email && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 uppercase w-16">Email</span>
          <a href={`mailto:${owner!.owner_email}`} className="text-sm text-gold hover:underline">
            {owner!.owner_email}
          </a>
        </div>
      )}

      {/* Confidence */}
      <div className="pt-1">
        <span className={`text-xs px-2 py-0.5 rounded border ${confidenceColors[owner!.confidence]}`}>
          {owner!.confidence} confidence
        </span>
      </div>
    </div>
  )
}
