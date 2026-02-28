import type { AgentStatus } from '../../types/agents'
import { Pause, Globe, Brain, Search, FileText, PenLine, CheckCircle, Rocket, AlertTriangle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

const statusConfig: Record<AgentStatus, { Icon: LucideIcon; label: string; animation: string }> = {
  idle: { Icon: Pause, label: 'Ready', animation: '' },
  analyzing_website: { Icon: Globe, label: 'Analyzing brand...', animation: 'animate-pulse' },
  generating_profile: { Icon: Brain, label: 'Building ideal client...', animation: 'animate-spin-slow' },
  searching_linkedin: { Icon: Search, label: 'Hunting on LinkedIn...', animation: 'animate-bounce' },
  scraping_prospect: { Icon: FileText, label: 'Reading prospect profile...', animation: 'animate-pulse' },
  crafting_message: { Icon: PenLine, label: 'Crafting message...', animation: 'animate-pulse' },
  review_required: { Icon: CheckCircle, label: 'Review required', animation: 'animate-ping-slow' },
  sending_message: { Icon: Rocket, label: 'Delivering message...', animation: 'animate-bounce' },
  error: { Icon: AlertTriangle, label: 'Error', animation: '' }
}

export default function StatusAnimation({ status }: { status: AgentStatus }) {
  const config = statusConfig[status]

  return (
    <div className="flex items-center gap-2">
      <span className={config.animation}>
        <config.Icon className="w-5 h-5" />
      </span>
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
