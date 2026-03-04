import { useState } from 'react'
import { useCallModeStore } from '../../stores/callModeStore'
import { Shield, ChevronDown, ChevronUp } from 'lucide-react'

export default function ObjectionCards() {
  const { prep } = useCallModeStore()
  const [expanded, setExpanded] = useState<number | null>(null)

  if (!prep || !prep.objection_cards?.length) return null

  return (
    <div className="space-y-2">
      <span className="text-xs text-red-400 font-semibold flex items-center gap-1">
        <Shield className="w-3 h-3" /> OBJECTION CARDS
      </span>
      <div className="flex flex-wrap gap-2">
        {prep.objection_cards.map((card, i) => (
          <button
            key={i}
            onClick={() => setExpanded(expanded === i ? null : i)}
            className={`text-left rounded-lg p-3 text-sm transition-all ${
              expanded === i
                ? 'bg-red-500/10 border border-red-500/30 w-full'
                : 'bg-navy-800 border border-navy-600 hover:border-navy-500'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className={expanded === i ? 'text-red-400 font-medium' : 'text-gray-300'}>
                {card.objection}
              </span>
              {expanded === i ? <ChevronUp className="w-3 h-3 text-red-400 shrink-0" /> : <ChevronDown className="w-3 h-3 text-gray-500 shrink-0" />}
            </div>
            {expanded === i && (
              <p className="text-green-400 mt-2 pt-2 border-t border-red-500/20">
                {card.response}
              </p>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
