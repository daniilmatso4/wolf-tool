import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useLeadsStore } from '../stores/leadsStore'
import { useGamificationStore } from '../stores/gamificationStore'
import { formatPlaceTypes } from '../lib/categories'
import SalesBrief from '../components/business/SalesBrief'
import OwnerCard from '../components/business/OwnerCard'
import { Phone, Mail, MapPin, Globe, Star, Tag, User, Smartphone, AtSign, ArrowLeft, Handshake, FileText, DollarSign, ArrowRightLeft, Circle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Activity, ActivityType, ActivityOutcome } from '../types/activity'
import type { LeadStatus } from '../types/lead'

const STATUS_OPTIONS: { key: LeadStatus; label: string; color: string }[] = [
  { key: 'new', label: 'New', color: 'bg-status-new' },
  { key: 'contacted', label: 'Contacted', color: 'bg-status-contacted' },
  { key: 'interested', label: 'Interested', color: 'bg-status-interested' },
  { key: 'client', label: 'Client', color: 'bg-status-client' },
  { key: 'not_interested', label: 'Not Interested', color: 'bg-status-not-interested' }
]

export default function BusinessDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { leads, updateLead, removeLead } = useLeadsStore()
  const logActivity = useGamificationStore((s) => s.logActivity)
  const lead = leads.find((l) => l.id === id)

  const [activities, setActivities] = useState<Activity[]>([])
  const [notes, setNotes] = useState('')
  const [showLogModal, setShowLogModal] = useState<ActivityType | null>(null)
  const [logNotes, setLogNotes] = useState('')
  const [logOutcome, setLogOutcome] = useState<ActivityOutcome>('neutral')

  useEffect(() => {
    if (id) {
      window.api.activities.getByLeadId(id).then(setActivities)
    }
  }, [id])

  useEffect(() => {
    if (lead?.notes) setNotes(lead.notes)
  }, [lead?.notes])

  if (!lead) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Lead not found</p>
          <button onClick={() => navigate('/pipeline')} className="btn-outline">Back to Pipeline</button>
        </div>
      </div>
    )
  }

  const handleStatusChange = async (status: LeadStatus) => {
    await updateLead(lead.id, { status })
    if (status === 'client') {
      const activity = { id: uuidv4(), lead_id: lead.id, type: 'deal_closed' as ActivityType, outcome: 'positive' as ActivityOutcome, notes: 'Deal closed!' }
      await window.api.activities.create(activity)
      await logActivity('deal_closed')
      setActivities((prev) => [{ ...activity, created_at: new Date().toISOString() }, ...prev])
    }
  }

  const handleLogActivity = async () => {
    if (!showLogModal) return
    const activity = {
      id: uuidv4(),
      lead_id: lead.id,
      type: showLogModal,
      outcome: logOutcome,
      notes: logNotes || null
    }
    const created = await window.api.activities.create(activity)
    await logActivity(showLogModal)
    setActivities((prev) => [created, ...prev])
    setShowLogModal(null)
    setLogNotes('')
    setLogOutcome('neutral')
  }

  const handleSaveNotes = async () => {
    await updateLead(lead.id, { notes })
  }

  const handleDelete = async () => {
    if (confirm('Delete this lead? This cannot be undone.')) {
      await removeLead(lead.id)
      navigate('/pipeline')
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pipeline')} className="btn-ghost text-sm flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
          <h1 className="text-2xl font-bold text-white">{lead.name}</h1>
          {!lead.has_website && (
            <span className="status-badge bg-gold/20 text-gold border border-gold/30">
              NO WEBSITE - PERFECT TARGET!
            </span>
          )}
        </div>
        <button onClick={handleDelete} className="text-red-400 text-sm hover:text-red-300">Delete Lead</button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left: Contact Info */}
        <div className="col-span-2 space-y-4">
          {/* Contact Card */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Contact Info</h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Phone" value={lead.phone} Icon={Phone} isLink={lead.phone ? `tel:${lead.phone}` : undefined} />
              <InfoRow label="Email" value={lead.email} Icon={Mail} isLink={lead.email ? `mailto:${lead.email}` : undefined} />
              <InfoRow label="Address" value={lead.address} Icon={MapPin} />
              <InfoRow label="Website" value={lead.has_website ? lead.website : 'No website'} Icon={Globe} />
              <InfoRow label="Rating" value={lead.rating ? `${lead.rating} (${lead.rating_count} reviews)` : 'N/A'} Icon={Star} />
              <InfoRow label="Category" value={formatPlaceTypes(lead.types)} Icon={Tag} />
              {lead.owner_name && (
                <InfoRow label="Owner" value={`${lead.owner_name}${lead.owner_title ? ` (${lead.owner_title})` : ''}`} Icon={User} />
              )}
              {lead.owner_phone && (
                <InfoRow label="Owner Phone" value={lead.owner_phone} Icon={Smartphone} isLink={`tel:${lead.owner_phone}`} />
              )}
              {lead.owner_email && (
                <InfoRow label="Owner Email" value={lead.owner_email} Icon={AtSign} isLink={`mailto:${lead.owner_email}`} />
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
            <div className="flex gap-3">
              <button onClick={() => setShowLogModal('call')} className="btn-gold flex-1 flex items-center justify-center gap-2">
                <Phone className="w-4 h-4" /> Log Call
              </button>
              <button onClick={() => setShowLogModal('email')} className="btn-outline flex-1 flex items-center justify-center gap-2">
                <Mail className="w-4 h-4" /> Log Email
              </button>
              <button onClick={() => setShowLogModal('meeting')} className="btn-outline flex-1 flex items-center justify-center gap-2">
                <Handshake className="w-4 h-4" /> Log Meeting
              </button>
              <button onClick={() => setShowLogModal('note')} className="btn-ghost flex-1 border border-navy-600 flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> Add Note
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSaveNotes}
              rows={4}
              className="input-field w-full resize-none"
              placeholder="Add notes about this lead..."
            />
          </div>

          {/* Activity Timeline */}
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Activity Timeline</h3>
            <div className="space-y-3">
              {activities.length === 0 ? (
                <p className="text-gray-500 text-sm">No activities yet. Start with a call!</p>
              ) : (
                activities.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 py-2 border-b border-navy-700 last:border-0">
                    <span className="mt-0.5"><ActivityIcon type={a.type} /></span>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white capitalize">{a.type.replace('_', ' ')}</span>
                        {a.outcome && (
                          <span className={`text-xs px-1.5 py-0.5 rounded ${outcomeColor(a.outcome)}`}>
                            {a.outcome}
                          </span>
                        )}
                      </div>
                      {a.notes && <p className="text-sm text-gray-400 mt-0.5">{a.notes}</p>}
                      <p className="text-xs text-gray-600 mt-1">{new Date(a.created_at).toLocaleString()}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right: Status */}
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Status</h3>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleStatusChange(s.key)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${
                    lead.status === s.key
                      ? 'bg-gold/10 text-gold border border-gold/30'
                      : 'text-gray-400 hover:bg-navy-700 border border-transparent'
                  }`}
                >
                  <div className={`w-2 h-2 rounded-full ${s.color}`} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card">
            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Priority</h3>
            <select
              value={lead.priority}
              onChange={(e) => updateLead(lead.id, { priority: e.target.value as any })}
              className="input-field w-full"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="card text-xs text-gray-500">
            <p>Created: {new Date(lead.created_at).toLocaleDateString()}</p>
            <p>Updated: {new Date(lead.updated_at).toLocaleDateString()}</p>
          </div>

          {/* Owner / Decision Maker */}
          <OwnerCard lead={lead} onOwnerFound={(owner) => {
            const updates: Record<string, unknown> = {}
            if (owner.owner_name) updates.owner_name = owner.owner_name
            if (owner.owner_title) updates.owner_title = owner.owner_title
            if (owner.owner_phone) updates.owner_phone = owner.owner_phone
            if (owner.owner_email) updates.owner_email = owner.owner_email
            if (Object.keys(updates).length > 0) updateLead(lead.id, updates)
          }} />

          {/* Sales Intelligence Brief */}
          <SalesBrief lead={lead} />
        </div>
      </div>

      {/* Log Activity Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowLogModal(null)}>
          <div className="bg-navy-800 border border-navy-600 rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4 capitalize">Log {showLogModal.replace('_', ' ')}</h3>
            {showLogModal !== 'note' && (
              <div className="mb-4">
                <label className="text-sm text-gray-400 block mb-1">Outcome</label>
                <div className="flex gap-2">
                  {(['positive', 'negative', 'no_answer', 'neutral'] as ActivityOutcome[]).map((o) => (
                    <button
                      key={o}
                      onClick={() => setLogOutcome(o)}
                      className={`px-3 py-1.5 rounded-lg text-sm capitalize ${
                        logOutcome === o
                          ? 'bg-gold/20 text-gold border border-gold/30'
                          : 'bg-navy-900 text-gray-400 border border-navy-600'
                      }`}
                    >
                      {o.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="mb-4">
              <label className="text-sm text-gray-400 block mb-1">Notes</label>
              <textarea
                value={logNotes}
                onChange={(e) => setLogNotes(e.target.value)}
                rows={3}
                className="input-field w-full resize-none"
                placeholder="Add details..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={handleLogActivity} className="btn-gold flex-1">Save</button>
              <button onClick={() => setShowLogModal(null)} className="btn-ghost flex-1 border border-navy-600">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value, Icon, isLink }: { label: string; value?: string | null; Icon: LucideIcon; isLink?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        {isLink && value ? (
          <a href={isLink} className="text-sm text-gold hover:underline">{value}</a>
        ) : (
          <p className="text-sm text-gray-300">{value || 'N/A'}</p>
        )}
      </div>
    </div>
  )
}

const activityIconMap: Record<string, LucideIcon> = {
  call: Phone,
  email: Mail,
  meeting: Handshake,
  note: FileText,
  deal_closed: DollarSign,
  status_change: ArrowRightLeft,
}

function ActivityIcon({ type }: { type: string }) {
  const Icon = activityIconMap[type] || Circle
  return <Icon className="w-5 h-5 text-gray-400" />
}

function outcomeColor(outcome: string): string {
  switch (outcome) {
    case 'positive': return 'bg-green-500/20 text-green-400'
    case 'negative': return 'bg-red-500/20 text-red-400'
    case 'no_answer': return 'bg-yellow-500/20 text-yellow-400'
    default: return 'bg-gray-500/20 text-gray-400'
  }
}
