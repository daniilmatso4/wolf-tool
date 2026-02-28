export type AgentId = 'jordan' | 'donnie' | 'naomi'

export type AgentStatus =
  | 'idle'
  | 'analyzing_website'
  | 'generating_profile'
  | 'searching_linkedin'
  | 'scraping_prospect'
  | 'crafting_message'
  | 'review_required'
  | 'sending_message'
  | 'error'

export interface AgentConfig {
  id: AgentId
  name: string
  title: string
  avatar: string
  color: string
}

export interface BrandAnalysis {
  brandSummary: string
  products: string[]
  idealClientProfile: string
  linkedinSearchQueries: string[]
}

export interface LinkedInProspect {
  name: string
  title: string
  company: string
  location: string
  aboutSnippet: string
  profileUrl: string
  connectionDegree: string
}

export interface AgentRun {
  id: string
  agentId: AgentId
  sessionId: string
  status: AgentStatus
  targetUrl: string
  brandAnalysis?: BrandAnalysis
  prospect?: LinkedInProspect
  craftedMessage?: string
  error?: string
  approved?: boolean
  messageSent?: boolean
  createdAt: string
  updatedAt: string
}

export interface AgentSession {
  id: string
  targetUrl: string
  brandAnalysis?: BrandAnalysis
  createdAt: string
  active: boolean
}
