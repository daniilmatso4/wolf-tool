import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLeadsStore } from '../stores/leadsStore'
import { useUIStore } from '../stores/uiStore'
import type { Lead, LeadStatus } from '../types/lead'

const STATUSES: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'bg-status-new' },
  { key: 'contacted', label: 'Contacted', color: 'bg-status-contacted' },
  { key: 'interested', label: 'Interested', color: 'bg-status-interested' },
  { key: 'client', label: 'Client', color: 'bg-status-client' },
  { key: 'not_interested', label: 'Not Interested', color: 'bg-status-not-interested' }
]

export default function Pipeline() {
  const { leads, updateLead } = useLeadsStore()
  const { pipelineView, setPipelineView } = useUIStore()
  const navigate = useNavigate()

  return (
    <div className="space-y-4 animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gold-gradient">Pipeline</h1>
        <div className="flex bg-navy-800 rounded-lg p-1">
          <button
            onClick={() => setPipelineView('kanban')}
            className={`px-3 py-1 rounded text-sm transition-colors ${pipelineView === 'kanban' ? 'bg-gold text-navy-950 font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setPipelineView('table')}
            className={`px-3 py-1 rounded text-sm transition-colors ${pipelineView === 'table' ? 'bg-gold text-navy-950 font-semibold' : 'text-gray-400 hover:text-white'}`}
          >
            Table
          </button>
        </div>
      </div>

      {pipelineView === 'kanban' ? (
        <KanbanView leads={leads} updateLead={updateLead} onClickLead={(id) => navigate(`/business/${id}`)} />
      ) : (
        <TableView leads={leads} updateLead={updateLead} onClickLead={(id) => navigate(`/business/${id}`)} />
      )}
    </div>
  )
}

function KanbanView({
  leads,
  updateLead,
  onClickLead
}: {
  leads: Lead[]
  updateLead: (id: string, f: Partial<Lead>) => Promise<void>
  onClickLead: (id: string) => void
}) {
  const [draggedId, setDraggedId] = useState<string | null>(null)

  const handleDragStart = (id: string) => setDraggedId(id)

  const handleDrop = async (status: LeadStatus) => {
    if (draggedId) {
      await updateLead(draggedId, { status })
      setDraggedId(null)
    }
  }

  return (
    <div className="flex gap-4 flex-1 overflow-x-auto pb-4">
      {STATUSES.map((s) => {
        const columnLeads = leads.filter((l) => l.status === s.key)
        return (
          <div
            key={s.key}
            className="flex-1 min-w-[220px] bg-navy-950 rounded-xl p-3 flex flex-col"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(s.key)}
          >
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className={`w-2.5 h-2.5 rounded-full ${s.color}`} />
              <span className="text-sm font-semibold text-gray-300">{s.label}</span>
              <span className="text-xs text-gray-500 ml-auto">{columnLeads.length}</span>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  draggable
                  onDragStart={() => handleDragStart(lead.id)}
                  onClick={() => onClickLead(lead.id)}
                  className="card p-3 cursor-pointer hover:border-gold/30 transition-all duration-200 group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <h4 className="text-sm font-medium text-white truncate group-hover:text-gold transition-colors">{lead.name}</h4>
                  </div>
                  {!lead.has_website && (
                    <span className="inline-block status-badge bg-gold/20 text-gold text-[9px] mb-1">NO WEBSITE</span>
                  )}
                  {lead.phone && <p className="text-xs text-gray-500 truncate">{lead.phone}</p>}
                  {lead.rating && (
                    <p className="text-xs text-gray-500">{'\u2B50'} {lead.rating}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function TableView({
  leads,
  updateLead,
  onClickLead
}: {
  leads: Lead[]
  updateLead: (id: string, f: Partial<Lead>) => Promise<void>
  onClickLead: (id: string) => void
}) {
  const [sortField, setSortField] = useState<'name' | 'status' | 'rating' | 'created_at'>('created_at')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else { setSortField(field); setSortDir('asc') }
  }

  const sorted = [...leads].sort((a, b) => {
    const va = a[sortField] ?? ''
    const vb = b[sortField] ?? ''
    const cmp = va < vb ? -1 : va > vb ? 1 : 0
    return sortDir === 'asc' ? cmp : -cmp
  })

  return (
    <div className="card overflow-auto flex-1">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-navy-700">
            <Th label="Name" field="name" current={sortField} dir={sortDir} onClick={toggleSort} />
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Phone</th>
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Website</th>
            <Th label="Rating" field="rating" current={sortField} dir={sortDir} onClick={toggleSort} />
            <Th label="Status" field="status" current={sortField} dir={sortDir} onClick={toggleSort} />
            <th className="text-left py-2 px-3 text-gray-500 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((lead) => (
            <tr
              key={lead.id}
              onClick={() => onClickLead(lead.id)}
              className="border-b border-navy-700/50 hover:bg-navy-700/30 cursor-pointer transition-colors"
            >
              <td className="py-2.5 px-3">
                <span className="font-medium text-white">{lead.name}</span>
              </td>
              <td className="py-2.5 px-3 text-gray-400">{lead.phone || '-'}</td>
              <td className="py-2.5 px-3">
                {lead.has_website ? (
                  <span className="text-green-400 text-xs">Has website</span>
                ) : (
                  <span className="text-gold text-xs font-semibold">NO WEBSITE</span>
                )}
              </td>
              <td className="py-2.5 px-3 text-gray-400">{lead.rating ? `${lead.rating} \u2B50` : '-'}</td>
              <td className="py-2.5 px-3">
                <select
                  value={lead.status}
                  onChange={(e) => { e.stopPropagation(); updateLead(lead.id, { status: e.target.value as LeadStatus }) }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-navy-900 border border-navy-600 rounded px-2 py-1 text-xs text-white"
                >
                  {STATUSES.map((s) => (
                    <option key={s.key} value={s.key}>{s.label}</option>
                  ))}
                </select>
              </td>
              <td className="py-2.5 px-3">
                <button
                  onClick={(e) => { e.stopPropagation(); onClickLead(lead.id) }}
                  className="text-xs text-gold hover:underline"
                >
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <p className="text-center text-gray-500 py-8">No leads yet. Go discover some!</p>
      )}
    </div>
  )
}

function Th({
  label,
  field,
  current,
  dir,
  onClick
}: {
  label: string
  field: string
  current: string
  dir: string
  onClick: (f: any) => void
}) {
  return (
    <th
      className="text-left py-2 px-3 text-gray-500 font-medium cursor-pointer hover:text-gray-300 select-none"
      onClick={() => onClick(field)}
    >
      {label} {current === field ? (dir === 'asc' ? '\u25B2' : '\u25BC') : ''}
    </th>
  )
}
