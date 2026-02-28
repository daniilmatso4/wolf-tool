import { BrowserWindow, session } from 'electron'

interface LinkedInCookie {
  name: string
  value: string
  domain: string
  path: string
  secure: boolean
  httpOnly: boolean
  expirationDate?: number
}

interface LinkedInProspect {
  name: string
  title: string
  company: string
  location: string
  aboutSnippet: string
  profileUrl: string
  connectionDegree: string
}

function delay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout: ${label} exceeded ${ms}ms`)), ms)
    promise.then(
      (val) => { clearTimeout(timer); resolve(val) },
      (err) => { clearTimeout(timer); reject(err) }
    )
  })
}

// Shows a visible BrowserWindow for the user to log into LinkedIn manually
export async function showLinkedInLogin(): Promise<{ cookies: LinkedInCookie[]; userAgent: string }> {
  const partition = 'persist:linkedin'
  const ses = session.fromPartition(partition)

  await ses.clearStorageData()

  const loginWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    title: 'LinkedIn Login - Wolf Tool',
    webPreferences: {
      partition,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  await loginWindow.loadURL('https://www.linkedin.com/login')

  return new Promise((resolve, reject) => {
    const checkInterval = setInterval(async () => {
      try {
        if (loginWindow.isDestroyed()) return
        const cookies = await ses.cookies.get({ domain: '.linkedin.com' })
        const hasLiAt = cookies.some((c) => c.name === 'li_at')
        if (hasLiAt) {
          clearInterval(checkInterval)
          const userAgent = loginWindow.webContents.getUserAgent()
          const serialized: LinkedInCookie[] = cookies.map((c) => ({
            name: c.name,
            value: c.value,
            domain: c.domain || '.linkedin.com',
            path: c.path || '/',
            secure: c.secure || false,
            httpOnly: c.httpOnly || false,
            expirationDate: c.expirationDate
          }))
          loginWindow.close()
          resolve({ cookies: serialized, userAgent })
        }
      } catch {
        // Window might be closed
      }
    }, 2000)

    loginWindow.on('closed', () => {
      clearInterval(checkInterval)
      reject(new Error('LinkedIn login window closed before login completed'))
    })
  })
}

// Hidden BrowserWindow bot for LinkedIn automation
export class LinkedInBot {
  private window: BrowserWindow | null = null
  private partition: string
  private cookies: LinkedInCookie[]
  private userAgent: string

  constructor(agentId: string, cookies: LinkedInCookie[], userAgent: string) {
    this.partition = `persist:linkedin-${agentId}`
    this.cookies = cookies
    this.userAgent = userAgent
  }

  async init(): Promise<void> {
    const ses = session.fromPartition(this.partition)

    for (const cookie of this.cookies) {
      await ses.cookies.set({
        url: 'https://www.linkedin.com',
        name: cookie.name,
        value: cookie.value,
        domain: cookie.domain,
        path: cookie.path,
        secure: cookie.secure,
        httpOnly: cookie.httpOnly,
        expirationDate: cookie.expirationDate
      })
    }

    this.window = new BrowserWindow({
      width: 1280,
      height: 900,
      show: false,
      webPreferences: {
        partition: this.partition,
        nodeIntegration: false,
        contextIsolation: true
      }
    })

    this.window.webContents.setUserAgent(this.userAgent)

    // Detect renderer crash
    this.window.webContents.on('render-process-gone', (_event, details) => {
      console.error(`[LinkedIn Bot] Renderer crashed: ${details.reason}`)
      this.window = null
    })
  }

  async searchProspects(query: string): Promise<LinkedInProspect[]> {
    if (!this.window) throw new Error('Bot not initialized')

    const encodedQuery = encodeURIComponent(query)
    const searchUrl = `https://www.linkedin.com/search/results/people/?keywords=${encodedQuery}&origin=GLOBAL_SEARCH_HEADER`

    await withTimeout(this.window.loadURL(searchUrl), 60000, 'LinkedIn search load')
    await delay(5000, 8000)

    // Wait for search results to appear (retry up to 3 times)
    for (let attempt = 0; attempt < 3; attempt++) {
      const hasContent = await withTimeout(this.window.webContents.executeJavaScript(`
        document.querySelectorAll('a[href*="/in/"]').length > 0
      `), 30000, 'LinkedIn search content check')
      if (hasContent) break
      await delay(3000, 5000)
    }

    // Check if we got redirected to login
    const currentUrl = this.window.webContents.getURL()
    if (currentUrl.includes('/login') || currentUrl.includes('/authwall')) {
      throw new Error('LinkedIn session expired - please re-login')
    }

    const prospects: LinkedInProspect[] = await withTimeout(this.window.webContents.executeJavaScript(`
      (function() {
        var results = []
        // Grab all profile links on the page
        var allLinks = Array.from(document.querySelectorAll('a[href*="/in/"]'))
        var seen = {}
        var profileLinks = allLinks.filter(function(a) {
          var href = a.href.split('?')[0]
          if (seen[href] || href.includes('/in/search/') || !href.match(/\\/in\\/[a-zA-Z0-9-]+/)) return false
          seen[href] = true
          return true
        })

        profileLinks.forEach(function(link, i) {
          if (i >= 10) return
          // Walk up to find the containing card/item
          var card = link.closest('li') || link.closest('[data-chameleon-result-urn]') || link.closest('.reusable-search__result-container') || link.parentElement.parentElement.parentElement

          var name = ''
          var title = ''
          var location = ''

          // Try to get name from the link itself or nearby
          var nameEl = link.querySelector('span[aria-hidden="true"]')
          if (!nameEl) nameEl = link.querySelector('span')
          if (nameEl) name = nameEl.textContent.trim()
          if (!name) name = link.textContent.trim()
          // Clean up name - remove "View … profile" etc
          name = name.replace(/View.*profile/gi, '').replace(/\\n/g, ' ').trim()
          // Take only first few words as name
          if (name.length > 60) name = name.split('\\n')[0].trim()

          if (card) {
            // Look for subtitle/title text
            var subtitleEl = card.querySelector('.entity-result__primary-subtitle')
              || card.querySelector('[class*="primary-subtitle"]')
              || card.querySelector('.t-14.t-black.t-normal')
            if (subtitleEl) title = subtitleEl.textContent.trim()

            var locEl = card.querySelector('.entity-result__secondary-subtitle')
              || card.querySelector('[class*="secondary-subtitle"]')
              || card.querySelector('.t-14.t-normal:not(.t-black)')
            if (locEl) location = locEl.textContent.trim()

            // Fallback: grab all small text lines
            if (!title) {
              var smallTexts = Array.from(card.querySelectorAll('.t-14, .t-12, [class*="subtitle"]'))
              smallTexts.forEach(function(el) {
                var text = el.textContent.trim()
                if (!title && text.length > 5 && text !== name) title = text
                else if (!location && text.length > 2 && text !== name && text !== title) location = text
              })
            }
          }

          var company = ''
          if (title && title.includes(' at ')) {
            var parts = title.split(' at ')
            company = parts[parts.length - 1].trim()
          }

          var profileUrl = link.href.split('?')[0]
          if (name && profileUrl) {
            results.push({
              name: name.substring(0, 100),
              title: title.substring(0, 200),
              company: company,
              location: location.substring(0, 100),
              aboutSnippet: '',
              profileUrl: profileUrl,
              connectionDegree: ''
            })
          }
        })

        return results
      })()
    `), 60000, 'LinkedIn search scrape')

    console.log(`[LinkedIn Bot] Search "${query}" found ${prospects.length} prospects`)
    return prospects
  }

  async scrapeProfile(profileUrl: string): Promise<LinkedInProspect> {
    if (!this.window) throw new Error('Bot not initialized')

    await withTimeout(this.window.loadURL(profileUrl), 30000, 'LinkedIn profile load')
    await delay(3000, 6000)

    const prospect: LinkedInProspect = await withTimeout(this.window.webContents.executeJavaScript(`
      (function() {
        var name = ''
        var title = ''
        var location = ''
        var about = ''
        var company = ''

        var nameEl = document.querySelector('.text-heading-xlarge')
        if (nameEl) name = nameEl.textContent.trim()

        var titleEl = document.querySelector('.text-body-medium.break-words')
        if (titleEl) title = titleEl.textContent.trim()

        var locEl = document.querySelector('.text-body-small.inline.t-black--light.break-words')
        if (locEl) location = locEl.textContent.trim()

        var aboutEl = document.querySelector('#about ~ .display-flex .inline-show-more-text')
        if (!aboutEl) aboutEl = document.querySelector('section.pv-about-section .inline-show-more-text')
        if (aboutEl) about = aboutEl.textContent.trim()

        var expSection = document.querySelector('#experience ~ .pvs-list__outer-container li')
        if (expSection) {
          var companyEl = expSection.querySelector('.t-14.t-normal span[aria-hidden="true"]')
          if (companyEl) company = companyEl.textContent.trim()
        }

        if (!company && title.includes(' at ')) {
          var parts = title.split(' at ')
          company = parts[parts.length - 1].trim()
        }

        return {
          name: name,
          title: title,
          company: company,
          location: location,
          aboutSnippet: about.substring(0, 500),
          profileUrl: window.location.href.split('?')[0],
          connectionDegree: ''
        }
      })()
    `), 30000, 'LinkedIn profile scrape')

    return prospect
  }

  async sendConnectionRequest(profileUrl: string, message: string): Promise<boolean> {
    if (!this.window) throw new Error('Bot not initialized')

    const currentUrl = this.window.webContents.getURL()
    if (!currentUrl.includes(profileUrl.replace('https://www.linkedin.com', ''))) {
      await withTimeout(this.window.loadURL(profileUrl), 30000, 'LinkedIn profile load for send')
      await delay(3000, 6000)
    }

    // Escape message for injection into JS
    const escapedMessage = message.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')

    const success: boolean = await withTimeout(this.window.webContents.executeJavaScript(`
      (async function() {
        // Find and click Connect button
        var buttons = Array.from(document.querySelectorAll('button'))
        var connectBtn = buttons.find(function(b) {
          return b.textContent.trim().includes('Connect') && !b.textContent.includes('Disconnect')
        })

        if (!connectBtn) {
          // Try the "More" dropdown first
          var moreBtn = buttons.find(function(b) { return b.textContent.trim() === 'More' })
          if (moreBtn) {
            moreBtn.click()
            await new Promise(function(r) { setTimeout(r, 1500) })
            var menuItems = Array.from(document.querySelectorAll('[role="menuitem"]'))
            connectBtn = menuItems.find(function(item) { return item.textContent.includes('Connect') })
          }
        }

        if (!connectBtn) return false
        connectBtn.click()
        await new Promise(function(r) { setTimeout(r, 2000) })

        // Click "Add a note"
        var addNoteBtn = Array.from(document.querySelectorAll('button')).find(function(b) {
          return b.textContent.trim().includes('Add a note')
        })
        if (addNoteBtn) {
          addNoteBtn.click()
          await new Promise(function(r) { setTimeout(r, 1500) })

          // Type the message
          var textarea = document.querySelector('textarea[name="message"]')
          if (!textarea) textarea = document.querySelector('#custom-message')
          if (!textarea) textarea = document.querySelector('textarea')
          if (textarea) {
            textarea.focus()
            textarea.value = '${escapedMessage}'
            textarea.dispatchEvent(new Event('input', { bubbles: true }))
            textarea.dispatchEvent(new Event('change', { bubbles: true }))
            await new Promise(function(r) { setTimeout(r, 1000) })
          }
        }

        // Click Send
        await new Promise(function(r) { setTimeout(r, 1000) })
        var sendBtn = Array.from(document.querySelectorAll('button')).find(function(b) {
          var text = b.textContent.trim()
          return text === 'Send' || (text.includes('Send') && b.getAttribute('aria-label'))
        })
        if (sendBtn) {
          sendBtn.click()
          return true
        }
        return false
      })()
    `), 45000, 'LinkedIn send connection')

    await delay(2000, 5000)
    return success
  }

  destroy(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close()
    }
    this.window = null
  }
}
