import { BrowserWindow } from 'electron'
import { v4 as uuid } from 'uuid'
import { scrapeWebsite } from './website-scraper.service'
import { analyzeBrand, craftOutreachMessage, BrandAnalysisResult } from './gemini.service'
import { LinkedInBot } from './linkedin.service'
import { agentRunsRepo, agentSessionsRepo, linkedinCookiesRepo } from '../database/repositories/agents'
import { sentOutreachRepo } from '../database/repositories/outreach'
import { settingsRepo } from '../database/repositories/settings'
import { withRetry, withTimeout } from './utils'

type AgentId = 'jordan' | 'donnie' | 'naomi'

interface AgentState {
  agentId: AgentId
  bot: LinkedInBot | null
  currentRunId: string | null
  running: boolean
  queryIndex: number
  prospectIndex: number
  prospects: any[]
  sessionId: string
  brandAnalysis: BrandAnalysisResult | null
}

function emitToRenderer(channel: string, data: unknown): void {
  const windows = BrowserWindow.getAllWindows()
  // Find the main app window (not LinkedIn hidden windows)
  const mainWindow = windows.find((w) => {
    try {
      const url = w.webContents.getURL()
      return !url.includes('linkedin.com') && w.isVisible()
    } catch {
      return false
    }
  })
  if (mainWindow) {
    mainWindow.webContents.send(channel, data)
  }
}

class AgentOrchestrator {
  private agents: Map<AgentId, AgentState> = new Map()
  private linkedinCookies: any[] | null = null
  private userAgent: string = ''

  async initSession(targetUrl: string): Promise<string> {
    const cookieData = linkedinCookiesRepo.get()
    if (!cookieData || !cookieData.valid) {
      throw new Error('LinkedIn session not found. Please log in to LinkedIn first.')
    }
    this.linkedinCookies = JSON.parse(cookieData.cookies)
    this.userAgent = cookieData.user_agent

    const sessionId = uuid()
    agentSessionsRepo.create({ id: sessionId, target_url: targetUrl })

    for (const agentId of ['jordan', 'donnie', 'naomi'] as AgentId[]) {
      const bot = new LinkedInBot(agentId, this.linkedinCookies!, this.userAgent)
      await bot.init()
      this.agents.set(agentId, {
        agentId,
        bot,
        currentRunId: null,
        running: false,
        queryIndex: 0,
        prospectIndex: 0,
        prospects: [],
        sessionId,
        brandAnalysis: null
      })
    }

    return sessionId
  }

  async startAgent(agentId: AgentId, targetUrl: string, sessionId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent || agent.running) return

    agent.running = true
    const runId = uuid()
    agent.currentRunId = runId

    const apiKey = settingsRepo.get('google_api_key')
    if (!apiKey) {
      emitToRenderer('agents:status', { agentId, status: 'error', runId, error: 'Google API key not configured' })
      agent.running = false
      return
    }

    try {
      // Step 1: Analyze website
      agentRunsRepo.create({ id: runId, agent_id: agentId, session_id: sessionId, target_url: targetUrl })
      emitToRenderer('agents:status', { agentId, status: 'analyzing_website', runId })
      agentRunsRepo.updateStatus(runId, 'analyzing_website')

      let brandAnalysis: BrandAnalysisResult
      const existingSession = agentSessionsRepo.getById(sessionId)
      if (existingSession?.brand_analysis) {
        brandAnalysis = JSON.parse(existingSession.brand_analysis as string)
      } else {
        const websiteContent = await withRetry(() => withTimeout(scrapeWebsite(targetUrl), 30000, 'website scrape'), 2, 2000, 'scrapeWebsite')
        brandAnalysis = await withRetry(() => analyzeBrand(websiteContent, apiKey), 2, 2000, 'analyzeBrand')
        agentSessionsRepo.updateBrandAnalysis(sessionId, JSON.stringify(brandAnalysis))
      }

      agent.brandAnalysis = brandAnalysis
      emitToRenderer('agents:brandAnalysis', { agentId, brandAnalysis })

      // Step 2: Generate profile
      emitToRenderer('agents:status', { agentId, status: 'generating_profile', runId })
      agentRunsRepo.updateStatus(runId, 'generating_profile')

      // Brief pause for visual effect
      await new Promise((r) => setTimeout(r, 1500))

      // Step 3: Search LinkedIn and propose
      await this.searchAndPropose(agentId)
    } catch (err) {
      const errorMsg = (err as Error).message
      emitToRenderer('agents:status', { agentId, status: 'error', runId, error: errorMsg })
      if (agent.currentRunId) {
        agentRunsRepo.updateStatus(agent.currentRunId, 'error')
      }
      agent.running = false
    }
  }

  private async searchAndPropose(agentId: AgentId): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent || !agent.bot || !agent.brandAnalysis) return

    const apiKey = settingsRepo.get('google_api_key')!
    const runId = agent.currentRunId!
    const queries = agent.brandAnalysis.linkedinSearchQueries

    // Step 3: Search LinkedIn
    emitToRenderer('agents:status', { agentId, status: 'searching_linkedin', runId })
    agentRunsRepo.updateStatus(runId, 'searching_linkedin')

    if (agent.prospects.length === 0 || agent.prospectIndex >= agent.prospects.length) {
      if (agent.queryIndex >= queries.length) {
        agent.queryIndex = 0
      }
      const query = queries[agent.queryIndex]
      agent.queryIndex++

      try {
        agent.prospects = await agent.bot.searchProspects(query)
      } catch (err) {
        // Try next query if this one fails
        if (agent.queryIndex < queries.length) {
          agent.prospects = await agent.bot.searchProspects(queries[agent.queryIndex])
          agent.queryIndex++
        }
      }
      agent.prospectIndex = 0
    }

    if (agent.prospects.length === 0) {
      emitToRenderer('agents:status', { agentId, status: 'error', runId, error: 'No prospects found on LinkedIn' })
      agent.running = false
      return
    }

    // Pick next prospect (bounds check)
    if (agent.prospectIndex >= agent.prospects.length) {
      emitToRenderer('agents:status', { agentId, status: 'error', runId, error: 'No more prospects available' })
      agent.running = false
      return
    }
    const rawProspect = agent.prospects[agent.prospectIndex]
    agent.prospectIndex++

    // Step 4: Scrape full profile
    emitToRenderer('agents:status', { agentId, status: 'scraping_prospect', runId })
    agentRunsRepo.updateStatus(runId, 'scraping_prospect')

    let prospect = rawProspect
    if (rawProspect.profileUrl) {
      try {
        prospect = await agent.bot.scrapeProfile(rawProspect.profileUrl)
      } catch {
        // Use search result data as fallback
      }
    }

    // Step 5: Craft message
    emitToRenderer('agents:status', { agentId, status: 'crafting_message', runId })
    agentRunsRepo.updateStatus(runId, 'crafting_message')

    const message = await craftOutreachMessage(agent.brandAnalysis, prospect, apiKey)

    // Step 6: Enter review mode
    agentRunsRepo.updateProspect(runId, JSON.stringify(prospect), message)
    emitToRenderer('agents:status', { agentId, status: 'review_required', runId })
    emitToRenderer('agents:review', { agentId, runId, prospect, message })
  }

  async approveRun(agentId: AgentId, runId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent || !agent.bot) return

    emitToRenderer('agents:status', { agentId, status: 'sending_message', runId })
    agentRunsRepo.updateStatus(runId, 'sending_message')
    agentRunsRepo.approve(runId)

    const run = agentRunsRepo.getById(runId)
    if (!run) return

    const prospect = JSON.parse(run.prospect as string)
    const message = run.crafted_message as string

    try {
      await agent.bot.sendConnectionRequest(prospect.profileUrl, message)
      agentRunsRepo.markSent(runId)

      // Track outreach for response monitoring
      sentOutreachRepo.create({
        id: runId,
        session_id: agent.sessionId,
        agent_id: agentId,
        prospect_name: prospect.name,
        prospect_title: prospect.title,
        prospect_company: prospect.company,
        prospect_profile_url: prospect.profileUrl,
        message
      })

      emitToRenderer('agents:status', { agentId, status: 'idle', runId })
      emitToRenderer('agents:sent', { agentId, runId, success: true })
    } catch (err) {
      emitToRenderer('agents:status', { agentId, status: 'error', runId, error: (err as Error).message })
    }

    agent.running = false
  }

  async rejectRun(agentId: AgentId, runId: string): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) return

    agentRunsRepo.reject(runId)

    // Create new run and find next prospect
    const newRunId = uuid()
    agent.currentRunId = newRunId
    agentRunsRepo.create({
      id: newRunId,
      agent_id: agentId,
      session_id: agent.sessionId,
      target_url: '',
      brand_analysis: agent.brandAnalysis ? JSON.stringify(agent.brandAnalysis) : undefined
    })

    try {
      await this.searchAndPropose(agentId)
    } catch (err) {
      emitToRenderer('agents:status', { agentId, status: 'error', runId: newRunId, error: (err as Error).message })
      agent.running = false
    }
  }

  async restartAgent(agentId: AgentId): Promise<void> {
    const agent = this.agents.get(agentId)
    if (!agent) return

    // Destroy old bot
    agent.bot?.destroy()
    agent.running = false

    // Create fresh bot
    if (this.linkedinCookies) {
      const bot = new LinkedInBot(agentId, this.linkedinCookies, this.userAgent)
      await bot.init()
      agent.bot = bot
    }
    emitToRenderer('agents:status', { agentId, status: 'idle', runId: agent.currentRunId })
  }

  stopAgent(agentId: AgentId): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      agent.running = false
      agent.bot?.destroy()
      agent.bot = null
    }
  }

  stopAll(): void {
    for (const agentId of this.agents.keys()) {
      this.stopAgent(agentId)
    }
    this.agents.clear()
  }
}

export const orchestrator = new AgentOrchestrator()
