import { net } from 'electron'

function httpGet(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    request.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    let data = ''
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk.toString()
      })
      response.on('end', () => resolve(data))
    })
    request.on('error', (err) => reject(err))
    request.end()
  })
}

function httpGetWithTimeout(url: string, timeoutMs: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout fetching ${url}`)), timeoutMs)
    httpGet(url).then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
}

export async function scrapeWebsite(url: string): Promise<string> {
  // Ensure URL has protocol
  if (!url.startsWith('http')) url = 'https://' + url

  if (!isValidUrl(url)) {
    throw new Error(`Invalid URL: ${url}`)
  }

  const html = await httpGet(url)
  return stripHtml(html).substring(0, 8000)
}

export interface DeepScrapeResult {
  homepageText: string
  subpageTexts: string[]
  emails: string[]
  allText: string
}

export async function deepScrapeWebsite(url: string): Promise<DeepScrapeResult> {
  if (!url.startsWith('http')) url = 'https://' + url
  if (!isValidUrl(url)) throw new Error(`Invalid URL: ${url}`)

  const homepageHtml = await httpGet(url)
  const homepageText = stripHtml(homepageHtml)

  // Find links to about/team/contact/staff/leadership pages
  const subpagePattern = /href=["']([^"']*?)["'][^>]*>([^<]*)/gi
  const targetKeywords = /about|team|contact|staff|leadership|our-team|meet|people|founders|management/i
  const baseUrl = new URL(url)
  const matchedUrls = new Set<string>()

  let match: RegExpExecArray | null
  while ((match = subpagePattern.exec(homepageHtml)) !== null) {
    const href = match[1]
    const anchorText = match[2]
    if (targetKeywords.test(href) || targetKeywords.test(anchorText)) {
      try {
        const resolved = new URL(href, baseUrl.origin).href
        // Only follow links on the same domain
        if (new URL(resolved).hostname === baseUrl.hostname) {
          matchedUrls.add(resolved)
        }
      } catch {
        // Invalid URL — skip
      }
    }
    if (matchedUrls.size >= 5) break
  }

  // Crawl matched subpages
  const subpageTexts: string[] = []
  const allHtmlParts = [homepageHtml]

  for (const subUrl of matchedUrls) {
    try {
      const subHtml = await httpGetWithTimeout(subUrl, 10000)
      allHtmlParts.push(subHtml)
      subpageTexts.push(stripHtml(subHtml))
    } catch {
      // Subpage unreachable — skip
    }
  }

  // Extract emails from raw HTML of all pages
  const emailPattern = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g
  const emailSet = new Set<string>()
  for (const html of allHtmlParts) {
    const found = html.match(emailPattern)
    if (found) found.forEach((e) => emailSet.add(e.toLowerCase()))
  }
  // Filter out common non-personal emails
  const junkPatterns = /^(info|support|help|admin|noreply|no-reply|webmaster|sales|contact|hello|team)@/i
  const emails = [...emailSet].filter((e) => !junkPatterns.test(e))

  // Combine all text, capped at 12000 chars
  const allText = [homepageText, ...subpageTexts].join('\n\n').substring(0, 12000)

  return { homepageText, subpageTexts, emails, allText }
}
