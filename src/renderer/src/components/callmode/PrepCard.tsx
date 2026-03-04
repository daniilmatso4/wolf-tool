import { useCallModeStore } from '../../stores/callModeStore'
import { Copy, Check, MessageSquare, Lightbulb, Clock, Target } from 'lucide-react'
import { useState } from 'react'

export default function PrepCard() {
  const { prep, prepLoading } = useCallModeStore()
  const [copiedOpener, setCopiedOpener] = useState(false)

  if (prepLoading) {
    return (
      <div className="card space-y-4">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">AI Call Prep</h3>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Preparing your call...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!prep) {
    return (
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">AI Call Prep</h3>
        <p className="text-gray-500 text-sm mt-2">Select a lead to generate call prep</p>
      </div>
    )
  }

  const copyOpener = () => {
    navigator.clipboard.writeText(prep.opener)
    setCopiedOpener(true)
    setTimeout(() => setCopiedOpener(false), 2000)
  }

  return (
    <div className="card space-y-4 overflow-y-auto max-h-[calc(100vh-340px)]">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">AI Call Prep</h3>

      {/* Opener */}
      <div className="bg-navy-900 rounded-lg p-3 border border-navy-700">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gold font-semibold flex items-center gap-1">
            <MessageSquare className="w-3 h-3" /> OPENER
          </span>
          <button onClick={copyOpener} className="text-xs text-gray-500 hover:text-gold flex items-center gap-1">
            {copiedOpener ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedOpener ? 'Copied' : 'Copy'}
          </button>
        </div>
        <p className="text-white text-sm">{prep.opener}</p>
      </div>

      {/* Talking Points */}
      <div>
        <span className="text-xs text-blue-400 font-semibold flex items-center gap-1 mb-2">
          <Lightbulb className="w-3 h-3" /> TALKING POINTS
        </span>
        <ul className="space-y-2">
          {prep.talking_points.map((tp, i) => (
            <li key={i} className="text-sm text-gray-300 flex gap-2">
              <span className="text-blue-400 font-bold shrink-0">{i + 1}.</span>
              {tp}
            </li>
          ))}
        </ul>
      </div>

      {/* Why Now */}
      <div className="bg-orange-500/5 rounded-lg p-3 border border-orange-500/20">
        <span className="text-xs text-orange-400 font-semibold flex items-center gap-1 mb-1">
          <Clock className="w-3 h-3" /> WHY NOW
        </span>
        <p className="text-sm text-gray-300">{prep.why_now}</p>
      </div>

      {/* Product Fit */}
      <div className="bg-green-500/5 rounded-lg p-3 border border-green-500/20">
        <span className="text-xs text-green-400 font-semibold flex items-center gap-1 mb-1">
          <Target className="w-3 h-3" /> PRODUCT FIT
        </span>
        <p className="text-sm text-gray-300">{prep.product_fit}</p>
      </div>
    </div>
  )
}
