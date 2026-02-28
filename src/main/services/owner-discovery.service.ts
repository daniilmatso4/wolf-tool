import { net } from 'electron'
import { ownerDiscoveryRepo } from '../database/repositories/outreach'
import { leadsRepo } from '../database/repositories/leads'
import { settingsRepo } from '../database/repositories/settings'
import { deepScrapeWebsite } from './website-scraper.service'
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

export interface OwnerDiscoveryResult {
  owner_name: string | null
  owner_title: string | null
  owner_phone: string | null
  owner_email: string | null
  confidence: 'high' | 'medium' | 'low' | 'none'
}

export async function discoverOwner(lead: {
  name: string
  phone?: string
  website?: string
  has_website: boolean
  address?: string
  types?: string
}): Promise<OwnerDiscoveryResult> {
  const apiKey = settingsRepo.get('google_api_key')
  if (!apiKey) throw new Error('Google API key not configured')

  if (!lead.website || !lead.has_website) {
    return { owner_name: null, owner_title: null, owner_phone: null, owner_email: null, confidence: 'none' }
  }

  let scrapeData = { homepageText: '', subpageTexts: [] as string[], emails: [] as string[], allText: '' }
  try {
    scrapeData = await withRetry(() => deepScrapeWebsite(lead.website!), 2, 1000, 'deepScrapeForOwner')
  } catch {
    return { owner_name: null, owner_title: null, owner_phone: null, owner_email: null, confidence: 'none' }
  }

  const businessInfo = [
    `Business: ${lead.name}`,
    lead.address ? `Location: ${lead.address}` : '',
    lead.types ? `Category: ${lead.types}` : '',
    lead.phone ? `Business Phone: ${lead.phone}` : '',
    scrapeData.emails.length > 0 ? `Emails found on website: ${scrapeData.emails.join(', ')}` : '',
    scrapeData.allText ? `\nWebsite Content (homepage + about/team/contact pages):\n${scrapeData.allText}` : ''
  ].filter(Boolean).join('\n')

  const prompt = `You are a business intelligence analyst. Your task is to identify the owner or primary decision-maker of this business from the website content provided.

${businessInfo}

Analyze the website content carefully. Look for:
- Names mentioned alongside titles like Owner, Founder, CEO, President, Principal, Managing Director, Proprietor
- "About" or "Team" page content identifying leadership
- Contact information tied to specific individuals
- Email addresses that appear to be personal (not info@, contact@, etc.)

Return a JSON object with these exact keys:
- "owner_name": The full name of the owner/decision-maker, or null if not found
- "owner_title": Their title (e.g. "Owner", "CEO", "Founder"), or null if not found
- "owner_phone": A direct phone number for the owner if found (different from the main business line), or null
- "owner_email": The owner's personal/direct email address, or null
- "confidence": One of "high", "medium", "low", or "none"
  - "high": Name and title clearly stated on the website (e.g. "John Smith, Owner")
  - "medium": Name found in context suggesting ownership but not explicitly stated
  - "low": Best guess based on limited information
  - "none": Could not identify any owner information

IMPORTANT: Return ONLY valid JSON, no markdown fences, no extra text.`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1024,
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
  return JSON.parse(jsonStr) as OwnerDiscoveryResult
}

export async function getOrDiscoverOwner(leadId: string, lead: Parameters<typeof discoverOwner>[0]): Promise<OwnerDiscoveryResult> {
  // Check cache first
  const cached = ownerDiscoveryRepo.get(leadId)
  if (cached) {
    return {
      owner_name: (cached.owner_name as string) || null,
      owner_title: (cached.owner_title as string) || null,
      owner_phone: (cached.owner_phone as string) || null,
      owner_email: (cached.owner_email as string) || null,
      confidence: (cached.confidence as OwnerDiscoveryResult['confidence']) || 'none'
    }
  }

  const result = await discoverOwner(lead)

  // Cache result
  ownerDiscoveryRepo.upsert({
    lead_id: leadId,
    owner_name: result.owner_name,
    owner_title: result.owner_title,
    owner_phone: result.owner_phone,
    owner_email: result.owner_email,
    confidence: result.confidence
  })

  // Update lead record with owner fields
  const updates: Record<string, unknown> = {}
  if (result.owner_name) updates.owner_name = result.owner_name
  if (result.owner_title) updates.owner_title = result.owner_title
  if (result.owner_phone) updates.owner_phone = result.owner_phone
  if (result.owner_email) updates.owner_email = result.owner_email
  if (Object.keys(updates).length > 0) {
    leadsRepo.update(leadId, updates)
  }

  return result
}

export function clearOwnerCache(leadId: string): void {
  ownerDiscoveryRepo.delete(leadId)
}
