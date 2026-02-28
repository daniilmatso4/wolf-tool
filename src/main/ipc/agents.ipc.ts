import { ipcMain, BrowserWindow } from 'electron'
import { join } from 'path'
import { safeHandle } from './ipc-utils'
import { orchestrator } from '../services/agent-orchestrator.service'
import { showLinkedInLogin } from '../services/linkedin.service'
import { linkedinCookiesRepo, agentRunsRepo } from '../database/repositories/agents'

export function registerAgentsIPC(): void {
  // Show editable message in a native popup window — returns edited text on save
  safeHandle('agents:showMessage', (_e, data: { agentName: string; agentAvatar: string; prospectName: string; prospectTitle: string; prospectCompany: string; message: string; runId: string }) => {
    return new Promise((resolve) => {
      const escapedMsg = data.message.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$')

      const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${data.agentName} - Edit Message</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #0a0e27; color: #e5e7eb; font-family: 'Segoe UI', system-ui, sans-serif; padding: 24px; }
  .header { display: flex; align-items: center; gap: 10px; margin-bottom: 20px; }
  .avatar { font-size: 28px; }
  .agent-name { font-size: 18px; font-weight: 700; color: #d4a843; }
  .section { background: #111640; border: 1px solid #252d6b; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
  .label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
  .prospect-name { font-size: 15px; font-weight: 600; color: #fff; }
  .prospect-detail { font-size: 13px; color: #9ca3af; margin-top: 2px; }
  textarea {
    width: 100%; min-height: 140px; background: #050816; border: 1px solid #252d6b; border-radius: 8px;
    color: #e5e7eb; font-family: inherit; font-size: 15px; line-height: 1.7; padding: 12px; resize: vertical;
    outline: none;
  }
  textarea:focus { border-color: #d4a843; }
  .char-count { font-size: 11px; color: #4b5563; text-align: right; margin-top: 6px; }
  .char-count.over { color: #ef4444; }
  .buttons { display: flex; gap: 12px; }
  .btn-save {
    flex: 1; padding: 12px; font-size: 14px; font-weight: 600; border-radius: 8px; border: none; cursor: pointer;
    background: linear-gradient(to right, #b08a2e, #d4a843); color: #050816;
  }
  .btn-save:hover { filter: brightness(1.1); }
  .btn-cancel {
    flex: 1; padding: 12px; font-size: 14px; border-radius: 8px; cursor: pointer;
    background: transparent; border: 1px solid rgba(212,168,67,0.4); color: #d4a843;
  }
  .btn-cancel:hover { background: rgba(212,168,67,0.1); }
</style></head><body>
  <div class="header">
    <span class="avatar">${data.agentAvatar}</span>
    <span class="agent-name">${data.agentName}</span>
  </div>
  <div class="section">
    <div class="label">Prospect</div>
    <div class="prospect-name">${data.prospectName}</div>
    <div class="prospect-detail">${data.prospectTitle}</div>
    ${data.prospectCompany ? '<div class="prospect-detail" style="color:#6b7280">' + data.prospectCompany + '</div>' : ''}
  </div>
  <div class="section">
    <div class="label">Connection Message (editable)</div>
    <textarea id="msg">${escapedMsg}</textarea>
    <div class="char-count" id="counter">${data.message.length}/280 characters</div>
  </div>
  <div class="buttons">
    <button class="btn-save" id="saveBtn">Save Changes</button>
    <button class="btn-cancel" id="cancelBtn">Cancel</button>
  </div>
  <script>
    const textarea = document.getElementById('msg');
    const counter = document.getElementById('counter');
    textarea.addEventListener('input', () => {
      const len = textarea.value.length;
      counter.textContent = len + '/280 characters';
      counter.className = len > 280 ? 'char-count over' : 'char-count';
    });
    document.getElementById('saveBtn').addEventListener('click', () => {
      window.popupApi.save(textarea.value);
    });
    document.getElementById('cancelBtn').addEventListener('click', () => {
      window.popupApi.cancel();
    });
  </script>
</body></html>`

      const popup = new BrowserWindow({
        width: 520,
        height: 500,
        title: `${data.agentName} - Edit Message`,
        resizable: true,
        minimizable: false,
        maximizable: false,
        webPreferences: {
          preload: join(__dirname, '../preload/popup.js'),
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true
        }
      })
      popup.setMenuBarVisibility(false)
      popup.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)

      // Listen for IPC messages from popup preload
      const onSave = (_ev: any, message: string): void => {
        agentRunsRepo.updateMessage(data.runId, message)
        cleanup()
        popup.close()
        resolve({ saved: true, message })
      }
      const onCancel = (): void => {
        cleanup()
        popup.close()
        resolve({ saved: false })
      }
      const cleanup = (): void => {
        ipcMain.removeListener('popup:save', onSave)
        ipcMain.removeListener('popup:cancel', onCancel)
      }

      ipcMain.on('popup:save', onSave)
      ipcMain.on('popup:cancel', onCancel)

      popup.on('closed', () => {
        cleanup()
        resolve({ saved: false })
      })
    })
  })

  // LinkedIn login flow
  safeHandle('agents:linkedinLogin', async () => {
    const { cookies, userAgent } = await showLinkedInLogin()
    linkedinCookiesRepo.save(JSON.stringify(cookies), userAgent)
    return { success: true }
  })

  safeHandle('agents:linkedinStatus', () => {
    const data = linkedinCookiesRepo.get()
    return { loggedIn: !!data && !!data.valid, loggedInAt: data?.logged_in_at }
  })

  // Session management
  safeHandle('agents:startSession', async (_e, targetUrl: string) => {
    const sessionId = await orchestrator.initSession(targetUrl)
    return { sessionId }
  })

  // Start individual agent
  safeHandle('agents:startAgent', async (_e, agentId: string, targetUrl: string, sessionId: string) => {
    orchestrator.startAgent(agentId as any, targetUrl, sessionId)
    return { success: true }
  })

  // Start all 3 agents with staggered delays
  safeHandle('agents:startAll', async (_e, targetUrl: string, sessionId: string) => {
    const agents = ['jordan', 'donnie', 'naomi'] as const
    for (let i = 0; i < agents.length; i++) {
      setTimeout(() => {
        orchestrator.startAgent(agents[i], targetUrl, sessionId)
      }, i * 2000)
    }
    return { success: true }
  })

  // Approve / Reject
  safeHandle('agents:approve', async (_e, agentId: string, runId: string) => {
    await orchestrator.approveRun(agentId as any, runId)
    return { success: true }
  })

  safeHandle('agents:reject', async (_e, agentId: string, runId: string) => {
    await orchestrator.rejectRun(agentId as any, runId)
    return { success: true }
  })

  // Stop
  safeHandle('agents:stopAgent', (_e, agentId: string) => {
    orchestrator.stopAgent(agentId as any)
    return { success: true }
  })

  safeHandle('agents:stopAll', () => {
    orchestrator.stopAll()
    return { success: true }
  })

  // Restart
  safeHandle('agents:restartAgent', async (_e, agentId: string) => {
    await orchestrator.restartAgent(agentId as any)
    return { success: true }
  })

  // History
  safeHandle('agents:getSessionRuns', (_e, sessionId: string) => {
    return agentRunsRepo.getBySession(sessionId)
  })
}
