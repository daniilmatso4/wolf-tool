import type { AgentStatus } from '../../types/agents'

const statusConfig: Record<AgentStatus, { icon: string; label: string; animation: string }> = {
  idle: { icon: '\u23F8', label: 'Ready', animation: '' },
  analyzing_website: { icon: '\uD83C\uDF10', label: 'Analyzing brand...', animation: 'animate-pulse' },
  generating_profile: { icon: '\uD83E\uDDE0', label: 'Building ideal client...', animation: 'animate-spin-slow' },
  searching_linkedin: { icon: '\uD83D\uDD0D', label: 'Hunting on LinkedIn...', animation: 'animate-bounce' },
  scraping_prospect: { icon: '\uD83D\uDCDD', label: 'Reading prospect profile...', animation: 'animate-pulse' },
  crafting_message: { icon: '\u270D\uFE0F', label: 'Crafting message...', animation: 'animate-pulse' },
  review_required: { icon: '\u2705', label: 'Review required', animation: 'animate-ping-slow' },
  sending_message: { icon: '\uD83D\uDE80', label: 'Delivering message...', animation: 'animate-bounce' },
  error: { icon: '\u26A0\uFE0F', label: 'Error', animation: '' }
}

export default function StatusAnimation({ status }: { status: AgentStatus }) {
  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2">
      <span className={`text-lg ${config.animation}`}>{config.icon}</span>
      <span className="text-sm text-gray-300">{config.label}</span>
      {status !== 'idle' && status !== 'error' && status !== 'review_required' && (
        <div className="flex gap-1 ml-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-gold animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      )}
    </div>
  )
}
