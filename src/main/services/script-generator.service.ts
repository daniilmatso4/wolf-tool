import { net } from 'electron'
import { settingsRepo } from '../database/repositories/settings'
import { productRepo } from '../database/repositories/product'

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

function getProductContext(): string {
  const p = productRepo.get()
  if (!p || !p.product_name) return 'No product configured.'
  const benefits = JSON.parse((p.key_benefits as string) || '[]')
  const usps = JSON.parse((p.unique_selling_points as string) || '[]')
  const objections = JSON.parse((p.common_objections as string) || '[]')
  return `Product: ${p.product_name}
Company: ${p.company_name || ''}
Type: ${p.product_type || ''}
Pitch: ${p.elevator_pitch || ''}
Benefits: ${benefits.join(', ') || 'N/A'}
USPs: ${usps.join(', ') || 'N/A'}
Price: ${p.price_range || 'N/A'}
Known Objections: ${objections.map((o: any) => o.objection).join('; ') || 'N/A'}`
}

export async function generateScript(context: { industry?: string; business_type?: string }): Promise<{ name: string; script_body: string }> {
  const apiKey = settingsRepo.get('google_api_key')
  if (!apiKey) throw new Error('Google API key not configured')

  const productCtx = getProductContext()

  const prompt = `You are a B2B cold calling expert. Generate a call script.

SELLER CONTEXT:
${productCtx}

TARGET: ${context.industry || 'General'} businesses${context.business_type ? ` (${context.business_type})` : ''}

Generate a complete cold calling script with:
1. Introduction (who you are, why you're calling)
2. Value hook (why they should care)
3. Discovery questions (2-3)
4. Pitch (tailored to the target)
5. Close (next step / meeting ask)

Use {business_name}, {owner_name}, {industry} as placeholders that get filled per call.

Return a JSON object:
- "name": A short descriptive name for this script
- "script_body": The full script with sections marked by ## headers

IMPORTANT: Return ONLY valid JSON, no markdown fences.`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } }
  }

  const raw = await httpPost(url, body, { 'Content-Type': 'application/json' })
  const data = JSON.parse(raw)
  if (data.error) throw new Error(`Gemini API error: ${data.error.message}`)

  const parts = data.candidates?.[0]?.content?.parts || []
  const textPart = parts.filter((p: any) => p.text && !p.thought).pop() || parts[parts.length - 1]
  const text = textPart?.text || ''
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(jsonStr)
}

export async function generateObjectionResponses(context: { category?: string }): Promise<{ objections: { category: string; objection: string; response: string }[] }> {
  const apiKey = settingsRepo.get('google_api_key')
  if (!apiKey) throw new Error('Google API key not configured')

  const productCtx = getProductContext()

  const prompt = `You are a B2B sales objection handling expert.

SELLER CONTEXT:
${productCtx}

Generate 4-5 common objections${context.category ? ` in the "${context.category}" category` : ''} with strong responses.

Categories: price, timing, competition, authority, need, general

Return a JSON object:
- "objections": Array of objects with "category", "objection", "response"

Each response should:
- Acknowledge the concern
- Reframe with value
- Include a transition question to keep the conversation going

IMPORTANT: Return ONLY valid JSON, no markdown fences.`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048, thinkingConfig: { thinkingBudget: 0 } }
  }

  const raw = await httpPost(url, body, { 'Content-Type': 'application/json' })
  const data = JSON.parse(raw)
  if (data.error) throw new Error(`Gemini API error: ${data.error.message}`)

  const parts = data.candidates?.[0]?.content?.parts || []
  const textPart = parts.filter((p: any) => p.text && !p.thought).pop() || parts[parts.length - 1]
  const text = textPart?.text || ''
  const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(jsonStr)
}
