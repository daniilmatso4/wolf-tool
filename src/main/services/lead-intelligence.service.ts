import { net } from 'electron'
import { leadIntelRepo } from '../database/repositories/outreach'
import { settingsRepo } from '../database/repositories/settings'
import { scrapeWebsite } from './website-scraper.service'
import { withRetry } from './utils'

function httpPost(url: string, body: object, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request({ url, method: 'POST' })
    for (const [key, val] of Object.entries(headers)) {
      request.setHeader(key, val)
    }
    let data = ''
    request.on('response', (response) => {
      response.on('data', (chunk) => { data += chunk.toString() })
      response.on('end', () => resolve(data))
    })
    request.on('error', (err) => reject(err))
    request.write(JSON.stringify(body))
    request.end()
  })
}

export interface SalesIntelResult {
  brief: string
  talking_points: string[]
  pain_points: string[]
  suggested_approach: string
  competitive_angle: string
}

export async function generateSalesBrief(lead: {
  name: string
  phone?: string
  website?: string
  has_website: boolean
  address?: string
  rating?: number
  rating_count?: number
  types?: string
  notes?: string
}): Promise<SalesIntelResult> {
  const apiKey = settingsRepo.get('google_api_key')
  if (!apiKey) throw new Error('Google API key not configured')

  // Gather what we know
  let websiteContent = ''
  if (lead.website && lead.has_website) {
    try {
      websiteContent = await withRetry(() => scrapeWebsite(lead.website!), 2, 1000, 'scrapeForIntel')
    } catch {
      // Website unreachable — proceed with what we have
    }
  }

  const businessInfo = [
    `Business: ${lead.name}`,
    lead.address ? `Location: ${lead.address}` : '',
    lead.types ? `Category: ${lead.types}` : '',
    lead.rating ? `Google Rating: ${lead.rating}/5 (${lead.rating_count || 0} reviews)` : '',
    lead.phone ? `Phone: ${lead.phone}` : '',
    lead.has_website ? `Website: ${lead.website}` : 'NO WEBSITE — this is their main pain point',
    lead.notes ? `Notes: ${lead.notes}` : '',
    websiteContent ? `\nWebsite Content (first 4000 chars):\n${websiteContent.substring(0, 4000)}` : ''
  ].filter(Boolean).join('\n')

  const prompt = `You are a B2B sales strategist preparing a sales intelligence brief. Analyze this business and generate actionable intelligence for a sales call.

${businessInfo}

Return a JSON object with these exact keys:
- "brief": A 2-3 sentence summary of the business, what they do, and their market position
- "talking_points": An array of 4-5 specific conversation starters and talking points for a sales call. Reference specific details about their business. Make each one a complete sentence.
- "pain_points": An array of 3-4 likely pain points this business has, based on their industry, size, and online presence (or lack thereof). Be specific, not generic.
- "suggested_approach": A paragraph describing the ideal sales approach — tone, pitch angle, what to lead with, what objections to expect
- "competitive_angle": A sentence about what differentiates your pitch versus competitors they might be considering

IMPORTANT: Return ONLY valid JSON, no markdown fences, no extra text.`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048,
      thinkingConfig: { thinkingBudget: 0 }
    }
  }

  const raw = await httpPost(url, body, { 'Content-Type': 'application/json' })
  const data = JSON.parse(raw)

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`)
  }

  const parts = data.candidates?.[0]?.content?.parts || []
  const textPart = parts.filter((p: any) => p.text && !p.thought).pop() || parts[parts.length - 1]
  const text = textPart?.text || ''
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(jsonStr) as SalesIntelResult
}

export async function getOrGenerateBrief(leadId: string, lead: Parameters<typeof generateSalesBrief>[0]): Promise<SalesIntelResult> {
  // Check cache first
  const cached = leadIntelRepo.get(leadId)
  if (cached) {
    return {
      brief: cached.brief as string,
      talking_points: JSON.parse(cached.talking_points as string),
      pain_points: JSON.parse(cached.pain_points as string),
      suggested_approach: cached.suggested_approach as string,
      competitive_angle: cached.competitive_angle as string || ''
    }
  }

  const result = await generateSalesBrief(lead)

  // Cache it
  leadIntelRepo.upsert({
    lead_id: leadId,
    brief: result.brief,
    talking_points: JSON.stringify(result.talking_points),
    pain_points: JSON.stringify(result.pain_points),
    suggested_approach: result.suggested_approach,
    competitive_angle: result.competitive_angle
  })

  return result
}

export function clearBriefCache(leadId: string): void {
  leadIntelRepo.delete(leadId)
}
