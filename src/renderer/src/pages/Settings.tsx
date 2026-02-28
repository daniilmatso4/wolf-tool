import { useState } from 'react'
import { useSettingsStore } from '../stores/settingsStore'
import { useGamificationStore } from '../stores/gamificationStore'
import { useLeadsStore } from '../stores/leadsStore'

export default function Settings() {
  const { settings, update } = useSettingsStore()
  const profile = useGamificationStore((s) => s.profile)
  const leads = useLeadsStore((s) => s.leads)

  const [apiKey, setApiKey] = useState(settings.google_api_key)
  const [username, setUsername] = useState(settings.username)
  const [testResult, setTestResult] = useState<{ valid: boolean; error?: string } | null>(null)
  const [testing, setTesting] = useState(false)

  const saveApiKey = async () => {
    await update('google_api_key', apiKey)
  }

  const saveUsername = async () => {
    await update('username', username)
    if (profile) {
      await window.api.gamification.updateProfile({ username })
    }
  }

  const testConnection = async () => {
    if (!apiKey) return
    setTesting(true)
    setTestResult(null)
    const result = await window.api.search.testApiKey(apiKey)
    setTestResult(result)
    setTesting(false)
  }

  const exportData = async (format: 'csv' | 'json') => {
    if (format === 'json') {
      const data = JSON.stringify(leads, null, 2)
      const blob = new Blob([data], { type: 'application/json' })
      downloadBlob(blob, 'leads.json')
    } else {
      const headers = ['Name', 'Phone', 'Email', 'Website', 'Address', 'Status', 'Rating', 'Notes']
      const rows = leads.map((l) => [
        l.name, l.phone || '', l.email || '', l.website || '', l.address || '',
        l.status, l.rating || '', l.notes || ''
      ].map((v) => `"${String(v).replace(/"/g, '""').replace(/\n/g, ' ')}"`).join(','))
      const csv = [headers.join(','), ...rows].join('\n')
      // UTF-8 BOM for Excel compatibility
      const bom = '\uFEFF'
      const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })
      downloadBlob(blob, 'leads.csv')
    }
  }

  return (
    <div className="space-y-6 max-w-2xl animate-fade-in">
      <h1 className="text-2xl font-bold gold-gradient">Settings</h1>

      {/* API Key */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Google Places API Key</h3>
        <div className="flex gap-3 mb-2">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your Google API key"
            className="input-field flex-1"
          />
          <button onClick={saveApiKey} className="btn-gold">Save</button>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={testConnection} disabled={testing || !apiKey} className="btn-outline text-sm">
            {testing ? 'Testing...' : 'Test Connection'}
          </button>
          {testResult && (
            <span className={`text-sm ${testResult.valid ? 'text-green-400' : 'text-red-400'}`}>
              {testResult.valid ? '\u2713 API key is valid!' : `\u2717 ${testResult.error}`}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Get your API key from the Google Cloud Console. Enable the Places API.
        </p>
      </div>

      {/* Profile */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Profile</h3>
        <div className="flex gap-3">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Your name"
            className="input-field flex-1"
          />
          <button onClick={saveUsername} className="btn-gold">Save</button>
        </div>
      </div>

      {/* Data Export */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Data Export</h3>
        <div className="flex gap-3">
          <button onClick={() => exportData('csv')} className="btn-outline text-sm">
            Export CSV
          </button>
          <button onClick={() => exportData('json')} className="btn-outline text-sm">
            Export JSON
          </button>
        </div>
        <p className="text-xs text-gray-600 mt-2">{leads.length} leads will be exported</p>
      </div>
    </div>
  )
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
