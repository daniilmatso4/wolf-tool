import { net } from 'electron'
import { productRepo } from '../database/repositories/product'

function httpPost(url: string, body: object, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request({ url, method: 'POST' })
    for (const [key, val] of Object.entries(headers)) {
      request.setHeader(key, val)
    }
    let data = ''
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk.toString()
      })
      response.on('end', () => resolve(data))
    })
    request.on('error', (err) => reject(err))
    request.write(JSON.stringify(body))
    request.end()
  })
}

export interface BrandAnalysisResult {
  brandSummary: string
  products: string[]
  idealClientProfile: string
  linkedinSearchQueries: string[]
}

export async function analyzeBrand(websiteContent: string, apiKey: string): Promise<BrandAnalysisResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

  const prompt = `Analyze the following website content for a B2B sales outreach campaign.
Return a JSON object with these exact keys:
- "brandSummary": A 2-3 sentence summary of what this company does
- "products": An array of their main products/services (max 5)
- "idealClientProfile": A description of who would benefit most from their services (job titles, industries, company size)
- "linkedinSearchQueries": An array of 3-5 LinkedIn search queries that would find ideal prospects for this brand. Use terms like job titles, industries, and keywords that would appear in LinkedIn profiles of potential buyers.

Website content:
${websiteContent.substring(0, 8000)}

IMPORTANT: Return ONLY valid JSON, no markdown fences, no extra text.`

  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 2048
    }
  }

  const raw = await httpPost(url, body, { 'Content-Type': 'application/json' })
  const data = JSON.parse(raw)

  if (data.error) {
    throw new Error(`Gemini API error: ${data.error.message}`)
  }

  // Gemini 2.5 Flash returns thinking + response as multiple parts - get the last text part
  const parts = data.candidates?.[0]?.content?.parts || []
  const textPart = parts.filter((p: any) => p.text && !p.thought).pop() || parts[parts.length - 1]
  const text = textPart?.text || ''
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(jsonStr) as BrandAnalysisResult
}

export async function craftOutreachMessage(
  brandAnalysis: BrandAnalysisResult,
  prospect: { name: string; title: string; company: string; aboutSnippet: string },
  apiKey: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`

  // Detect when "name" is actually a title (e.g. "CEO at Julius AI")
  const titleKeywords = /^(ceo|cto|cfo|coo|vp|director|manager|founder|co-founder|president|head|lead|chief|owner|partner)\b/i
  const looksLikeTitle = titleKeywords.test(prospect.name.trim()) || /\bat\b/i.test(prospect.name)

  let prospectName = prospect.name || ''
  let prospectTitle = prospect.title || ''
  let prospectCompany = prospect.company || ''

  // If name looks like a title, swap it and extract company
  if (looksLikeTitle && !prospectTitle) {
    prospectTitle = prospect.name
    if (prospect.name.includes(' at ')) {
      const parts = prospect.name.split(' at ')
      prospectTitle = parts[0].trim()
      if (!prospectCompany) prospectCompany = parts.slice(1).join(' at ').trim()
    }
    prospectName = '' // Don't pretend we have a name
  }

  // Extract company from title if still missing
  if (!prospectCompany && prospectTitle.includes(' at ')) {
    const parts = prospectTitle.split(' at ')
    prospectCompany = parts.slice(1).join(' at ').trim()
  }

  const nameInstruction = prospectName
    ? `- Their name is exactly: ${prospectName}\n- Address them by their ACTUAL name "${prospectName}" — never use "there" or a placeholder`
    : `- Their name is unknown. Do NOT guess a name. Instead, reference their role or company directly. Never write "Hi there" — be creative.`

  // Enhance sender context with product config if available
  let senderContext = `${brandAnalysis.brandSummary} Products: ${brandAnalysis.products.join(', ')}`
  const myProduct = productRepo.get()
  if (myProduct && myProduct.product_name && myProduct.elevator_pitch) {
    const benefits = JSON.parse((myProduct.key_benefits as string) || '[]')
    senderContext = `${myProduct.company_name || ''} — ${myProduct.elevator_pitch}${benefits.length ? ` Key benefits: ${benefits.slice(0, 3).join(', ')}` : ''}`
  }

  const prompt = `Write a LinkedIn connection request message (200-280 characters).

SENDER: ${senderContext}
RECIPIENT: ${prospectName ? `Name: ${prospectName}, ` : ''}Title: ${prospectTitle}, Company: ${prospectCompany}${prospect.aboutSnippet ? `, About: ${prospect.aboutSnippet}` : ''}

EXAMPLE of correct length (240 chars):
"Your work leading AI strategy at Acme Corp caught my attention. At Tekta.ai, we build custom multi-LLM solutions that help companies like yours ship AI products faster. Would love to connect and share some ideas that might be relevant."

NOW write a similar message for the recipient above. It MUST:
- Be 200-280 characters (count carefully, this is critical)
- Have 3 parts: hook about their role, value pitch about sender's products, call to action
- Use their actual name/title/company, NO placeholders like [Name] or {company}
- End with a complete sentence
- Sound natural and hand-written, not templated

Return ONLY the message, nothing else.`

  // Disable thinking to prevent token waste — thinking model burns output tokens on reasoning
  for (let attempt = 0; attempt < 3; attempt++) {
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 512,
        thinkingConfig: { thinkingBudget: 0 }
      }
    }

    const raw = await httpPost(url, body, { 'Content-Type': 'application/json' })
    const data = JSON.parse(raw)

    if (data.error) {
      throw new Error(`Gemini API error: ${data.error.message}`)
    }

    const parts = data.candidates?.[0]?.content?.parts || []
    const textPart = parts[parts.length - 1]
    let message = textPart?.text?.trim() || ''

    // Strip wrapping quotes
    if ((message.startsWith('"') && message.endsWith('"')) || (message.startsWith("'") && message.endsWith("'"))) {
      message = message.slice(1, -1)
    }

    message = sanitizePlaceholders(message, prospect)

    // Accept if >= 180 chars and ends properly
    const endsCleanly = /[.!?)"']$/.test(message)
    if (message.length >= 180 && message.length <= 300 && endsCleanly) {
      // Trim to 280 if slightly over, preserving clean endings
      if (message.length > 280) {
        const trimmed = message.substring(0, 280)
        // Try sentence boundary first (". ", "! ", "? ")
        const lastPeriod = trimmed.lastIndexOf('. ')
        const lastExclaim = trimmed.lastIndexOf('! ')
        const lastQuestion = trimmed.lastIndexOf('? ')
        const lastSentence = Math.max(lastPeriod, lastExclaim, lastQuestion)
        if (lastSentence > 180) {
          message = trimmed.substring(0, lastSentence + 1)
        } else {
          // Fall back to word boundary + period
          const lastSpace = trimmed.lastIndexOf(' ')
          if (lastSpace > 180) {
            message = trimmed.substring(0, lastSpace) + '.'
          } else {
            message = trimmed
          }
        }
      }
      return message
    }

    if (attempt === 2) return message

    console.log(`[Gemini] Message too short (${message.length} chars) or cut off, retrying (attempt ${attempt + 2}/3)...`)
  }

  return '' // Should never reach here
}

/**
 * Replace any remaining placeholder syntax with actual prospect values.
 * Catches patterns like [Name], {company}, [Prospect Company], {prospect name}, etc.
 */
function sanitizePlaceholders(
  message: string,
  prospect: { name: string; title: string; company: string; aboutSnippet: string }
): string {
  const name = prospect.name || ''
  const firstName = name.split(' ')[0] || name
  const title = prospect.title || ''
  const company = prospect.company || ''

  // Replace [bracketed] and {curly} placeholders that refer to prospect fields
  const replacements: Array<{ pattern: RegExp; value: string }> = [
    // Name placeholders
    { pattern: /\[(?:prospect['s]*\s*)?(?:first\s*)?name\]/gi, value: firstName },
    { pattern: /\{(?:prospect['s]*\s*)?(?:first\s*)?name\}/gi, value: firstName },
    { pattern: /\[(?:prospect['s]*\s*)?full\s*name\]/gi, value: name },
    { pattern: /\{(?:prospect['s]*\s*)?full\s*name\}/gi, value: name },
    // Title/Role placeholders
    { pattern: /\[(?:prospect['s]*\s*)?(?:title|role|position)\]/gi, value: title },
    { pattern: /\{(?:prospect['s]*\s*)?(?:title|role|position)\}/gi, value: title },
    // Company placeholders
    { pattern: /\[(?:prospect['s]*\s*)?(?:company|company\s*name|organization|org)\]/gi, value: company },
    { pattern: /\{(?:prospect['s]*\s*)?(?:company|company\s*name|organization|org)\}/gi, value: company },
  ]

  for (const { pattern, value } of replacements) {
    message = message.replace(pattern, value)
  }

  return message
}
