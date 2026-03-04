import { net } from 'electron'
import { settingsRepo } from '../database/repositories/settings'
import { analyticsRepo } from '../database/repositories/analytics'

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

export async function generateWeeklyInsights(): Promise<{ insights: string[] }> {
  const apiKey = settingsRepo.get('google_api_key')
  if (!apiKey) throw new Error('Google API key not configured')

  const trends = analyticsRepo.getVolumeTrends(14)
  const funnel = analyticsRepo.getConversionFunnel()
  const heatmap = analyticsRepo.getCallHeatmap()
  const industries = analyticsRepo.getIndustryStats()

  const dataContext = `
LAST 14 DAYS ACTIVITY:
${JSON.stringify(trends)}

CONVERSION FUNNEL:
${JSON.stringify(funnel)}

CALL TIMING HEATMAP (day_of_week 0=Sun, hour):
${JSON.stringify(heatmap)}

INDUSTRY PERFORMANCE:
${JSON.stringify(industries)}`

  const prompt = `You are a sales performance analyst. Based on this cold calling data, provide 3-5 actionable insights.

${dataContext}

Return a JSON object:
- "insights": Array of 3-5 string insights. Each should be specific, data-backed, and actionable.

Examples of good insights:
- "Restaurants have your highest conversion rate at 23%. Double down on this vertical."
- "Your answer rate peaks between 10-11am on Tuesdays. Schedule your power hours then."
- "You've made 40% fewer calls this week vs last week. Ramp back up to maintain pipeline."

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
