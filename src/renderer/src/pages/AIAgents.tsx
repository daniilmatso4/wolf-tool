import { useEffect, useState, useCallback } from 'react'
import { useAgentsStore } from '../stores/agentsStore'
import { useAuthStore } from '../stores/authStore'
import AgentCard from '../components/agents/AgentCard'
import ResponseInbox from '../components/agents/ResponseInbox'
import type { AgentId } from '../types/agents'

function PremiumGate() {
  return (
    <div className="p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold gold-gradient">AI Agents</h1>
          <p className="text-sm text-gray-400 mt-1">
            Deploy your wolf pack to find high-intent prospects
          </p>
        </div>
      </div>

      <div className="card border border-gold/20 text-center py-16 px-8">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-2xl font-bold text-white mb-2">Premium Feature</h2>
        <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
          AI Agents are available with a Premium subscription. Upgrade to unleash Jordan, Donnie, and Naomi — your automated sales wolf pack.
        </p>
        <div className="flex flex-col items-center gap-3">
          <a
            href="https://wolfengine.co/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-gold px-8 py-3 text-sm font-semibold"
          >
            Upgrade to Premium — $50/mo
          </a>
          <p className="text-xs text-gray-500">7-day free trial included</p>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-4 max-w-lg mx-auto">
          <div className="bg-navy-800/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🐺</div>
            <p className="text-xs font-medium text-white">Jordan</p>
            <p className="text-xs text-gray-500">Lead Hunter</p>
          </div>
          <div className="bg-navy-800/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🦊</div>
            <p className="text-xs font-medium text-white">Donnie</p>
            <p className="text-xs text-gray-500">Message Crafter</p>
          </div>
          <div className="bg-navy-800/50 rounded-lg p-4">
            <div className="text-2xl mb-2">🐆</div>
            <p className="text-xs font-medium text-white">Naomi</p>
            <p className="text-xs text-gray-500">Deal Closer</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AIAgents() {
  const license = useAuthStore((s) => s.license)

  if (license.tier !== 'premium') {
    return <PremiumGate />
  }
  const {
    configs,
    linkedinLoggedIn,
    targetUrl,
    brandAnalysis,
    agentStates,
    deploying,
    checkLinkedIn,
    loginLinkedIn,
    setTargetUrl,
    startSession,
    approveAgent,
    rejectAgent,
    stopAll,
    initListeners
  } = useAgentsStore()

  const handleMessageEdited = useCallback((agentId: AgentId, newMessage: string) => {
    useAgentsStore.setState((s) => ({
      agentStates: {
        ...s.agentStates,
        [agentId]: { ...s.agentStates[agentId], craftedMessage: newMessage }
      }
    }))
  }, [])

  const [urlInput, setUrlInput] = useState(targetUrl)

  useEffect(() => {
    checkLinkedIn()
    const cleanup = initListeners()
    return cleanup
  }, [])

  const hasActiveAgents = Object.values(agentStates).some(
    (s) => s.status !== 'idle' && s.status !== 'error'
  )

  const handleDeploy = () => {
    setTargetUrl(urlInput)
    useAgentsStore.setState({ targetUrl: urlInput })
    startSession()
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gold-gradient">AI Agents</h1>
          <p className="text-sm text-gray-400 mt-1">
            Deploy your wolf pack to find high-intent prospects
          </p>
        </div>
        {hasActiveAgents && (
          <button onClick={stopAll} className="btn-outline text-red-400 border-red-500/30 hover:bg-red-500/10 px-4 py-2 text-sm">
            Stop All Agents
          </button>
        )}
      </div>

      {/* LinkedIn Connection Status */}
      <div className="card flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">in</span>
          <div>
            <p className="text-sm font-medium text-white">LinkedIn Connection</p>
            <p className={`text-xs ${linkedinLoggedIn ? 'text-green-400' : 'text-gray-500'}`}>
              {linkedinLoggedIn ? 'Connected' : 'Not connected'}
            </p>
          </div>
        </div>
        {!linkedinLoggedIn && (
          <button onClick={loginLinkedIn} className="btn-gold px-4 py-2 text-sm">
            Connect LinkedIn
          </button>
        )}
        {linkedinLoggedIn && (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-xs text-green-400">Session active</span>
          </div>
        )}
      </div>

      {/* Target URL Input */}
      <div className="card">
        <label className="block text-sm text-gray-400 mb-2">Brand Website URL</label>
        <div className="flex gap-3">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://example.com"
            className="input-field flex-1"
            disabled={hasActiveAgents}
          />
          <button
            onClick={handleDeploy}
            disabled={!urlInput || !linkedinLoggedIn || deploying || hasActiveAgents}
            className="btn-gold px-6 py-2.5 text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
          >
            {deploying ? 'Deploying...' : 'Deploy All Agents'}
          </button>
        </div>
        {!linkedinLoggedIn && urlInput && (
          <p className="text-xs text-yellow-500 mt-2">
            Connect your LinkedIn account first to deploy agents
          </p>
        )}
      </div>

      {/* Brand Analysis Summary */}
      {brandAnalysis && (
        <div className="card border border-navy-700">
          <h3 className="text-sm font-semibold text-gold mb-2">Brand Analysis</h3>
          <p className="text-xs text-gray-300 leading-relaxed">{brandAnalysis.brandSummary}</p>
          {brandAnalysis.products.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {brandAnalysis.products.map((p, i) => (
                <span key={i} className="px-2 py-0.5 bg-navy-800 rounded text-xs text-gray-400">
                  {p}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Agent Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {configs.map((config) => {
          const state = agentStates[config.id]
          return (
            <AgentCard
              key={config.id}
              config={config}
              status={state.status}
              prospect={state.prospect}
              craftedMessage={state.craftedMessage}
              error={state.error}
              runId={state.runId}
              onApprove={approveAgent}
              onReject={rejectAgent}
              onMessageEdited={handleMessageEdited}
            />
          )
        })}
      </div>

      {/* Response Inbox */}
      <ResponseInbox />
    </div>
  )
}
