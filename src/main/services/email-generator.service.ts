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

export async function generateEmail(context: {
  lead_name: string
  lead_business?: string
  lead_industry?: string
  scenario: string // 'cold_intro' | 'after_positive_call' | 'after_voicemail' | 'post_meeting' | 'follow_up'
  call_notes?: string
  owner_name?: string
}): Promise<{ subject: string; body: string }> {
  const apiKey = settingsRepo.get('google_api_key')
  if (!apiKey) throw new Error('Google API key not configured')

  const myProduct = productRepo.get()
  let productCtx = ''
  if (myProduct && myProduct.product_name) {
    const benefits = JSON.parse((myProduct.key_benefits as string) || '[]')
    productCtx = `\nSENDER CONTEXT:
Company: ${myProduct.company_name || ''}
Product: ${myProduct.product_name}
Pitch: ${myProduct.elevator_pitch || ''}
Benefits: ${benefits.slice(0, 3).join(', ') || 'N/A'}
Website: ${myProduct.website || ''}`
  }

  const scenarioInstructions: Record<string, string> = {
    cold_intro: 'Write a cold introduction email. Hook them with relevance, provide value, and ask for a call.',
    after_positive_call: 'Write a follow-up email after a positive call. Reference the conversation, restate value, and propose next steps.',
    after_voicemail: 'Write a brief email after leaving a voicemail. Mention you called, provide a reason to reply.',
    post_meeting: 'Write a post-meeting recap email. Summarize key points discussed, restate agreed next steps.',
    follow_up: 'Write a general follow-up email. Re-engage the prospect with new value or a check-in.'
  }

  const prompt = `You are a B2B sales email copywriter.
${productCtx}

RECIPIENT:
Name: ${context.owner_name || context.lead_name}
Business: ${context.lead_business || ''}
Industry: ${context.lead_industry || ''}
${context.call_notes ? `Previous Call Notes: ${context.call_notes}` : ''}

SCENARIO: ${scenarioInstructions[context.scenario] || scenarioInstructions.follow_up}

Generate a professional email. Return a JSON object:
- "subject": Email subject line (< 60 chars)
- "body": Full email body. Keep it concise (150-250 words). Professional but warm tone. Include a clear CTA.

IMPORTANT: Return ONLY valid JSON, no markdown fences.`

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 1024, thinkingConfig: { thinkingBudget: 0 } }
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
