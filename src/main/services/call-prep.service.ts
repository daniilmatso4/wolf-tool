import { net } from 'electron'
import { settingsRepo } from '../database/repositories/settings'
import { productRepo } from '../database/repositories/product'
import { callPrepRepo } from '../database/repositories/callmode'
import { scrapeWebsite } from './website-scraper.service'
import { withRetry } from './utils'
import * as crypto from 'crypto'

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

function getProductHash(): string {
  const product = productRepo.get()
  if (!product) return 'none'
  const str = `${product.product_name}|${product.elevator_pitch}|${product.key_benefits}|${product.common_objections}`
  return crypto.createHash('md5').update(str).digest('hex').substring(0, 8)
}

export interface CallPrepData {
  opener: string
  talking_points: string[]
  objection_cards: { objection: string; response: string }[]
  why_now: string
  product_fit: string
}

export async function generateCallPrep(lead: {
  id: string
  name: string
  phone?: string
  website?: string
  has_website: boolean | number
  address?: string
  rating?: number
  rating_count?: number
  types?: string
  notes?: string
  owner_name?: string
  owner_title?: string
  status?: string
}): Promise<CallPrepData> {
  const apiKey = settingsRepo.get('google_api_key')
  if (!apiKey) throw new Error('Google API key not configured')

  const currentHash = getProductHash()

  // Check cache
  const cached = callPrepRepo.get(lead.id)
  if (cached && cached.product_hash === currentHash) {
    return {
      opener: cached.opener as string,
      talking_points: JSON.parse(cached.talking_points as string),
      objection_cards: JSON.parse(cached.objection_cards as string),
      why_now: cached.why_now as string,
      product_fit: cached.product_fit as string
    }
  }

  // Scrape website if available
  let websiteContent = ''
  if (lead.website && lead.has_website) {
    try {
      websiteContent = await withRetry(() => scrapeWebsite(lead.website!), 2, 1000, 'scrapeForCallPrep')
    } catch { /* proceed without */ }
  }

  const businessInfo = [
    `Business: ${lead.name}`,
    lead.address ? `Location: ${lead.address}` : '',
    lead.types ? `Category: ${lead.types}` : '',
    lead.rating ? `Google Rating: ${lead.rating}/5 (${lead.rating_count || 0} reviews)` : '',
    lead.owner_name ? `Owner/Contact: ${lead.owner_name}${lead.owner_title ? ` (${lead.owner_title})` : ''}` : '',
    lead.phone ? `Phone: ${lead.phone}` : '',
    lead.has_website ? `Website: ${lead.website}` : 'NO WEBSITE',
    lead.notes ? `Notes: ${lead.notes}` : '',
    lead.status ? `Current status: ${lead.status}` : '',
    websiteContent ? `\nWebsite Content:\n${websiteContent.substring(0, 3000)}` : ''
  ].filter(Boolean).join('\n')

  // Build product context
  let productContext = ''
  const myProduct = productRepo.get()
  if (myProduct && myProduct.product_name) {
    const benefits = JSON.parse((myProduct.key_benefits as string) || '[]')
    const usps = JSON.parse((myProduct.unique_selling_points as string) || '[]')
    const objections = JSON.parse((myProduct.common_objections as string) || '[]')
    const competitors = JSON.parse((myProduct.competitors as string) || '[]')

    productContext = `\n\nI AM SELLING:
Company: ${myProduct.company_name || ''}
Product: ${myProduct.product_name}
Type: ${myProduct.product_type || ''}
Pitch: ${myProduct.elevator_pitch || ''}
${benefits.length ? `Benefits: ${benefits.join(', ')}` : ''}
${usps.length ? `USPs: ${usps.join(', ')}` : ''}
${myProduct.price_range ? `Pricing: ${myProduct.price_range}` : ''}
${competitors.length ? `Competitors: ${competitors.join(', ')}` : ''}
${objections.length ? `Known Objections: ${objections.map((o: any) => o.objection).join('; ')}` : ''}`
  }

  const prompt = `You are a B2B cold calling coach. I'm about to call this business. Generate call preparation material.

TARGET BUSINESS:
${businessInfo}${productContext}

Return a JSON object with these exact keys:
- "opener": A personalized opening line (1-2 sentences) that hooks the prospect. Reference something specific about their business.
- "talking_points": An array of 3-4 specific talking points connecting MY product/service to THEIR business needs. Each should be a complete sentence.
- "objection_cards": An array of 3-4 objects with "objection" and "response" keys. Predict what this specific business might say and provide rebuttals.
- "why_now": A 1-2 sentence urgency angle — why they should act now.
- "product_fit": A 1-2 sentence summary of how well my product fits this business and why.

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
  const result = JSON.parse(jsonStr) as CallPrepData

  // Cache it
  callPrepRepo.upsert({
    lead_id: lead.id,
    opener: result.opener,
    talking_points: JSON.stringify(result.talking_points),
    objection_cards: JSON.stringify(result.objection_cards),
    why_now: result.why_now,
    product_fit: result.product_fit,
    product_hash: currentHash
  })

  return result
}
