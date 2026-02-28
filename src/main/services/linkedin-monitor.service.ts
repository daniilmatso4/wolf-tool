import { BrowserWindow, session } from 'electron'
import { sentOutreachRepo } from '../database/repositories/outreach'
import { linkedinCookiesRepo } from '../database/repositories/agents'

interface MonitorState {
  running: boolean
  window: BrowserWindow | null
  interval: NodeJS.Timeout | null
}

const state: MonitorState = {
  running: false,
  window: null,
  interval: null
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

function emitToRenderer(channel: string, data: unknown): void {
  const windows = BrowserWindow.getAllWindows()
  const mainWindow = windows.find((w) => {
    try {
      const url = w.webContents.getURL()
      return !url.includes('linkedin.com') && w.isVisible()
    } catch {
      return false
    }
  })
  if (mainWindow) {
    mainWindow.webContents.send(channel, data)
  }
}

async function initMonitorWindow(): Promise<BrowserWindow | null> {
  const cookieData = linkedinCookiesRepo.get()
  if (!cookieData || !cookieData.valid) return null

  const cookies = JSON.parse(cookieData.cookies)
  const partition = 'persist:linkedin-monitor'
  const ses = session.fromPartition(partition)

  for (const cookie of cookies) {
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

  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    show: false,
    webPreferences: {
      partition,
      nodeIntegration: false,
      contextIsolation: true
    }
  })

  win.webContents.setUserAgent(cookieData.user_agent)

  win.webContents.on('render-process-gone', () => {
    state.window = null
  })

  return win
}

async function checkForResponses(): Promise<void> {
  if (!state.window || state.window.isDestroyed()) {
    state.window = await initMonitorWindow()
    if (!state.window) return
  }

  const pending = sentOutreachRepo.getPending()
  if (pending.length === 0) return

  try {
    // Navigate to LinkedIn messaging
    await state.window.loadURL('https://www.linkedin.com/messaging/')
    await delay(5000)

    // Check if redirected to login
    const currentUrl = state.window.webContents.getURL()
    if (currentUrl.includes('/login') || currentUrl.includes('/authwall')) {
      console.log('[Monitor] LinkedIn session expired')
      return
    }

    // Extract conversation previews from messaging inbox
    const conversations: Array<{ name: string; snippet: string; profileUrl: string }> = await state.window.webContents.executeJavaScript(`
      (function() {
        var results = []
        var items = document.querySelectorAll('.msg-conversation-listitem, [class*="msg-conversation-card"]')
        items.forEach(function(item) {
          var nameEl = item.querySelector('.msg-conversation-listitem__participant-names, [class*="participant-name"]')
          var snippetEl = item.querySelector('.msg-conversation-card__message-snippet, [class*="message-snippet"]')
          var linkEl = item.querySelector('a[href*="/messaging/thread/"]')

          var name = nameEl ? nameEl.textContent.trim() : ''
          var snippet = snippetEl ? snippetEl.textContent.trim() : ''
          var profileUrl = ''

          // Try to extract profile URL from conversation
          if (linkEl) {
            profileUrl = linkEl.href || ''
          }

          if (name && snippet) {
            results.push({ name: name, snippet: snippet.substring(0, 200), profileUrl: profileUrl })
          }
        })
        return results.slice(0, 20)
      })()
    `)

    // Cross-reference with our sent outreach
    for (const conv of conversations) {
      for (const outreach of pending) {
        const prospectName = (outreach.prospect_name as string).toLowerCase()
        const convName = conv.name.toLowerCase()

        // Match by name (fuzzy — first name match or full name)
        const firstName = prospectName.split(' ')[0]
        if (convName.includes(firstName) && firstName.length > 2) {
          sentOutreachRepo.markResponseDetected(outreach.id as string, conv.snippet)
          emitToRenderer('monitor:response', {
            outreachId: outreach.id,
            prospectName: outreach.prospect_name,
            prospectCompany: outreach.prospect_company,
            snippet: conv.snippet,
            profileUrl: outreach.prospect_profile_url
          })
          console.log(`[Monitor] Response detected from ${outreach.prospect_name}: "${conv.snippet.substring(0, 50)}..."`)
          break
        }
      }
    }
  } catch (err) {
    console.error('[Monitor] Error checking responses:', (err as Error).message)
  }
}

export function startMonitor(intervalMinutes = 5): void {
  if (state.running) return
  state.running = true

  console.log(`[Monitor] Starting LinkedIn response monitor (every ${intervalMinutes}min)`)

  // Initial check after 30s
  setTimeout(() => {
    if (state.running) checkForResponses()
  }, 30000)

  // Periodic check
  state.interval = setInterval(() => {
    if (state.running) checkForResponses()
  }, intervalMinutes * 60 * 1000)
}

export function stopMonitor(): void {
  state.running = false
  if (state.interval) {
    clearInterval(state.interval)
    state.interval = null
  }
  if (state.window && !state.window.isDestroyed()) {
    state.window.close()
  }
  state.window = null
  console.log('[Monitor] Stopped LinkedIn response monitor')
}

export function isMonitorRunning(): boolean {
  return state.running
}

export function checkNow(): Promise<void> {
  return checkForResponses()
}
