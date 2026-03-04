import { useEffect, useState } from 'react'
import type { CallScript, ObjectionEntry } from '../types/script'
import { BookOpen, FileText, Shield, Sparkles, Plus, Trash2, ChevronDown, ChevronUp, Loader2, BarChart2 } from 'lucide-react'

const OBJECTION_CATEGORIES = ['price', 'timing', 'competition', 'authority', 'need', 'general'] as const

export default function Playbook() {
  const [tab, setTab] = useState<'scripts' | 'objections' | 'generate'>('scripts')
  const [scripts, setScripts] = useState<CallScript[]>([])
  const [objections, setObjections] = useState<ObjectionEntry[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const [s, o] = await Promise.all([
      window.api.scripts.getAll(),
      window.api.scripts.getObjections()
    ])
    setScripts(s)
    setObjections(o)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Playbook</h1>
            <p className="text-xs text-gray-500">Scripts, objection handling, and AI generation</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <TabBtn active={tab === 'scripts'} onClick={() => setTab('scripts')} icon={<FileText className="w-4 h-4" />} label="Scripts" />
        <TabBtn active={tab === 'objections'} onClick={() => setTab('objections')} icon={<Shield className="w-4 h-4" />} label="Objections" />
        <TabBtn active={tab === 'generate'} onClick={() => setTab('generate')} icon={<Sparkles className="w-4 h-4" />} label="AI Generate" />
      </div>

      {loading ? (
        <div className="card flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 text-gold animate-spin" />
        </div>
      ) : (
        <>
          {tab === 'scripts' && <ScriptsTab scripts={scripts} onRefresh={loadData} />}
          {tab === 'objections' && <ObjectionsTab objections={objections} onRefresh={loadData} />}
          {tab === 'generate' && <GenerateTab onRefresh={loadData} />}
        </>
      )}
    </div>
  )
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
        active ? 'bg-gold/10 text-gold border border-gold/30' : 'bg-navy-800 text-gray-400 border border-transparent hover:border-navy-600'
      }`}
    >
      {icon} {label}
    </button>
  )
}

function ScriptsTab({ scripts, onRefresh }: { scripts: CallScript[]; onRefresh: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newBody, setNewBody] = useState('')
  const [newIndustry, setNewIndustry] = useState('')

  const handleSave = async () => {
    if (!newName.trim() || !newBody.trim()) return
    await window.api.scripts.save({ name: newName, industry: newIndustry, script_body: newBody })
    setNewName(''); setNewBody(''); setNewIndustry(''); setShowAdd(false)
    onRefresh()
  }

  const handleDelete = async (id: string) => {
    await window.api.scripts.delete(id)
    onRefresh()
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)} className="btn-outline text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> New Script
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-3">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className="input-field w-full" placeholder="Script name" />
          <input value={newIndustry} onChange={(e) => setNewIndustry(e.target.value)} className="input-field w-full" placeholder="Target industry (optional)" />
          <textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} rows={8} className="input-field w-full resize-none font-mono text-sm" placeholder="Write your script here..." />
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-gold text-sm">Save Script</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {scripts.length === 0 && !showAdd ? (
        <div className="card text-center py-8">
          <FileText className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">No scripts yet. Create one or use AI Generate.</p>
        </div>
      ) : (
        scripts.map((s) => (
          <div key={s.id} className="card">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(expanded === s.id ? null : s.id)}>
              <div>
                <h4 className="text-white font-medium">{s.name}</h4>
                <div className="flex items-center gap-3 mt-1">
                  {s.industry && <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">{s.industry}</span>}
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <BarChart2 className="w-3 h-3" /> {s.usage_count} uses, {s.success_count} wins
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id) }} className="text-gray-500 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
                {expanded === s.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </div>
            </div>
            {expanded === s.id && (
              <div className="mt-3 pt-3 border-t border-navy-700">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono">{s.script_body}</pre>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}

function ObjectionsTab({ objections, onRefresh }: { objections: ObjectionEntry[]; onRefresh: () => void }) {
  const [showAdd, setShowAdd] = useState(false)
  const [category, setCategory] = useState<string>('general')
  const [objection, setObjection] = useState('')
  const [response, setResponse] = useState('')

  const handleSave = async () => {
    if (!objection.trim() || !response.trim()) return
    await window.api.scripts.saveObjection({ category, objection, response })
    setObjection(''); setResponse(''); setShowAdd(false)
    onRefresh()
  }

  const handleDelete = async (id: string) => {
    await window.api.scripts.deleteObjection(id)
    onRefresh()
  }

  const grouped = OBJECTION_CATEGORIES.map((cat) => ({
    category: cat,
    items: objections.filter((o) => o.category === cat)
  })).filter((g) => g.items.length > 0)

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(!showAdd)} className="btn-outline text-sm flex items-center gap-1">
          <Plus className="w-4 h-4" /> Add Objection
        </button>
      </div>

      {showAdd && (
        <div className="card space-y-3">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field w-full">
            {OBJECTION_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <input value={objection} onChange={(e) => setObjection(e.target.value)} className="input-field w-full" placeholder="The objection..." />
          <textarea value={response} onChange={(e) => setResponse(e.target.value)} rows={3} className="input-field w-full resize-none" placeholder="Your response..." />
          <div className="flex gap-2">
            <button onClick={handleSave} className="btn-gold text-sm">Save</button>
            <button onClick={() => setShowAdd(false)} className="btn-ghost text-sm">Cancel</button>
          </div>
        </div>
      )}

      {grouped.length === 0 && !showAdd ? (
        <div className="card text-center py-8">
          <Shield className="w-8 h-8 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-400">No objections yet. Add some or use AI Generate.</p>
        </div>
      ) : (
        grouped.map((g) => (
          <div key={g.category}>
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2 capitalize">{g.category}</h4>
            <div className="space-y-2">
              {g.items.map((o) => (
                <div key={o.id} className="card bg-navy-800 border-navy-700">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-red-400">"{o.objection}"</p>
                      <p className="text-sm text-green-400 mt-1">{o.response}</p>
                      <span className="text-xs text-gray-600 mt-1 inline-block">{o.usage_count} uses, {o.success_count} wins</span>
                    </div>
                    <button onClick={() => handleDelete(o.id)} className="text-gray-500 hover:text-red-400 shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function GenerateTab({ onRefresh }: { onRefresh: () => void }) {
  const [generating, setGenerating] = useState(false)
  const [industry, setIndustry] = useState('')
  const [category, setCategory] = useState('')
  const [result, setResult] = useState<string | null>(null)

  const handleGenerateScript = async () => {
    setGenerating(true)
    setResult(null)
    try {
      const script = await window.api.scripts.generate({ industry })
      await window.api.scripts.save({ name: script.name, industry, script_body: script.script_body })
      setResult(`Script "${script.name}" generated and saved!`)
      onRefresh()
    } catch (err: any) {
      setResult(`Error: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateObjections = async () => {
    setGenerating(true)
    setResult(null)
    try {
      const data = await window.api.scripts.generateObjections({ category: category || undefined })
      for (const obj of data.objections) {
        await window.api.scripts.saveObjection({ ...obj, source: 'ai' })
      }
      setResult(`${data.objections.length} objections generated and saved!`)
      onRefresh()
    } catch (err: any) {
      setResult(`Error: ${err.message}`)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold" /> Generate Call Script
        </h3>
        <p className="text-sm text-gray-400">AI generates a complete script based on your product and target industry.</p>
        <div className="flex gap-2">
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            className="input-field flex-1"
            placeholder="Target industry (e.g. Restaurants, Real Estate)"
          />
          <button onClick={handleGenerateScript} disabled={generating} className="btn-gold flex items-center gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate
          </button>
        </div>
      </div>

      <div className="card space-y-3">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-400" /> Generate Objection Responses
        </h3>
        <p className="text-sm text-gray-400">AI generates objections with responses tailored to your product.</p>
        <div className="flex gap-2">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-field flex-1">
            <option value="">All categories</option>
            {OBJECTION_CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
          </select>
          <button onClick={handleGenerateObjections} disabled={generating} className="btn-gold flex items-center gap-2">
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate
          </button>
        </div>
      </div>

      {result && (
        <div className={`card ${result.startsWith('Error') ? 'border-red-500/30' : 'border-green-500/30'}`}>
          <p className={`text-sm ${result.startsWith('Error') ? 'text-red-400' : 'text-green-400'}`}>{result}</p>
        </div>
      )}
    </div>
  )
}
