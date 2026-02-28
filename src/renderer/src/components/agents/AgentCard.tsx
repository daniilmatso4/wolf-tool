import type { AgentId, AgentConfig, AgentStatus, LinkedInProspect } from '../../types/agents'
import StatusAnimation from './StatusAnimation'

interface AgentCardProps {
  config: AgentConfig
  status: AgentStatus
  prospect: LinkedInProspect | null
  craftedMessage: string | null
  error: string | null
  runId: string | null
  onApprove: (agentId: AgentId) => void
  onReject: (agentId: AgentId) => void
  onMessageEdited: (agentId: AgentId, newMessage: string) => void
}

export default function AgentCard({
  config,
  status,
  prospect,
  craftedMessage,
  error,
  runId,
  onApprove,
  onReject,
  onMessageEdited
}: AgentCardProps) {
  const isReview = status === 'review_required'
  const isWorking = !['idle', 'error', 'review_required'].includes(status)
  const isError = status === 'error'

  const borderClass = isReview
    ? 'border-gold shadow-lg shadow-gold/20'
    : isError
      ? 'border-red-500/50'
      : isWorking
        ? 'border-blue-500/30'
        : 'border-navy-700'

  const handleShowMessage = async () => {
    if (!prospect || !craftedMessage || !runId) return
    const result = await (window as any).api.agents.showMessage({
      agentName: config.name,
      agentAvatar: config.avatar,
      prospectName: prospect.name || '',
      prospectTitle: prospect.title || '',
      prospectCompany: prospect.company || '',
      message: craftedMessage,
      runId
    })
    if (result?.saved && result.message) {
      onMessageEdited(config.id, result.message)
    }
  }

  return (
    <div
      className={`card border ${borderClass} transition-all duration-500 ${
        isReview ? 'ring-1 ring-gold/30' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="text-3xl">{config.avatar}</div>
        <div className="flex-1">
          <h3 className={`font-bold ${config.color}`}>{config.name}</h3>
          <p className="text-xs text-gray-500">{config.title}</p>
        </div>
        <div
          className={`w-2.5 h-2.5 rounded-full ${
            isWorking
              ? 'bg-blue-400 animate-pulse'
              : isReview
                ? 'bg-gold animate-pulse'
                : isError
                  ? 'bg-red-500'
                  : 'bg-gray-600'
          }`}
        />
      </div>

      {/* Status */}
      <StatusAnimation status={status} />

      {/* Error display */}
      {isError && error && (
        <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Review panel */}
      {isReview && prospect && craftedMessage && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {/* Prospect info */}
          <div className="p-3 bg-navy-800 rounded-lg">
            <p className="text-sm font-semibold text-white">{prospect.name}</p>
            <p className="text-xs text-gray-400">{prospect.title}</p>
            {prospect.company && (
              <p className="text-xs text-gray-500">{prospect.company}</p>
            )}
          </div>

          {/* Message preview + View Full button */}
          <div className="p-3 bg-navy-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500">Connection Message:</p>
              <span className="text-xs text-gray-600">{craftedMessage.length}/280</span>
            </div>
            <p className="text-sm text-gray-200 line-clamp-2" style={{ lineHeight: '1.5' }}>
              {craftedMessage}
            </p>
            <button
              onClick={handleShowMessage}
              className="text-xs text-gold hover:text-gold-light mt-2 block"
            >
              View Full Message
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(config.id)}
              className="flex-1 btn-gold py-2 text-sm font-semibold"
            >
              Approve & Send
            </button>
            <button
              onClick={() => onReject(config.id)}
              className="flex-1 btn-outline py-2 text-sm"
            >
              Skip & Find Next
            </button>
          </div>
        </div>
      )}

      {/* Working progress bar */}
      {isWorking && (
        <div className="mt-3 w-full bg-navy-800 rounded-full h-1 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-gold rounded-full animate-progress" />
        </div>
      )}
    </div>
  )
}
