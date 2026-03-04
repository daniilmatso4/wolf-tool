import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useGamificationStore } from '../stores/gamificationStore'
import { useLeadsStore } from '../stores/leadsStore'
import { useProductStore } from '../stores/productStore'
import { getRandomQuote } from '../lib/quotes'
import { getLevelForXP, getXPProgress, getNextLevel } from '../lib/levels'
import CampaignStats from '../components/dashboard/CampaignStats'
import SmartQueue from '../components/dashboard/SmartQueue'
import FollowUpWidget from '../components/followups/FollowUpWidget'
import { Phone, Mail, TrendingUp, DollarSign, Handshake, FileText, ArrowRightLeft, Circle, Package, ArrowRight, Clock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export default function Dashboard() {
  const profile = useGamificationStore((s) => s.profile)
  const leads = useLeadsStore((s) => s.leads)
  const isProductConfigured = useProductStore((s) => s.isConfigured)
  const navigate = useNavigate()
  const [quote, setQuote] = useState(getRandomQuote())
  const [todayCounts, setTodayCounts] = useState({ calls: 0, emails: 0, meetings: 0, deals: 0 })
  const [recentActivities, setRecentActivities] = useState<Array<{ id: string; type: string; lead_name?: string; created_at: string }>>([])

  useEffect(() => {
    const interval = setInterval(() => setQuote(getRandomQuote()), 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    window.api.activities.getTodayCounts().then(setTodayCounts)
    window.api.activities.getRecent(10).then(setRecentActivities)
  }, [])

  const level = profile ? getLevelForXP(profile.xp) : null
  const progress = profile ? getXPProgress(profile.xp) : null
  const nextLvl = level ? getNextLevel(level.level) : null

  const statusCounts = leads.reduce(
    (acc, l) => {
      acc[l.status] = (acc[l.status] || 0) + 1
      return acc
    },
    {} as Record<string, number>
  )

  const totalLeads = leads.length
  const clientCount = statusCounts['client'] || 0
  const conversionRate = totalLeads > 0 ? ((clientCount / totalLeads) * 100).toFixed(1) : '0'

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Product Setup Banner */}
      {!isProductConfigured && (
        <div
          onClick={() => navigate('/my-product')}
          className="card bg-gradient-to-r from-gold/10 to-orange-500/10 border-gold/30 cursor-pointer hover:border-gold/50 transition-all flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
            <Package className="w-5 h-5 text-gold" />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold">Set up your product to unlock AI-powered selling</p>
            <p className="text-sm text-gray-400">Configure what you sell so AI can tailor scripts, call prep, and objection handling to YOUR offer.</p>
          </div>
          <ArrowRight className="w-5 h-5 text-gold" />
        </div>
      )}

      {/* Quote Card */}
      <div className="card bg-gradient-to-r from-navy-800 to-navy-900 border-gold/20">
        <p className="text-lg italic text-gold/90">"{quote}"</p>
        <p className="text-xs text-gray-500 mt-2">- Wolf of Wall Street</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Calls Today" value={todayCounts.calls} Icon={Phone} color="text-blue-400" />
        <StatCard label="Emails Today" value={todayCounts.emails} Icon={Mail} color="text-purple-400" />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} Icon={TrendingUp} color="text-green-400" />
        <StatCard label="Total Deals" value={profile?.total_deals || 0} Icon={DollarSign} color="text-gold" />
      </div>

      {/* Smart Queue + Follow-ups + Campaign Stats */}
      <div className="grid grid-cols-3 gap-6">
        <SmartQueue />
        <FollowUpWidget />
        <CampaignStats />
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* XP Progress */}
        <div className="card col-span-1">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Your Progress</h3>
          {level && progress && (
            <>
              <div className="text-center mb-4">
                <p className="text-3xl font-bold gold-gradient">{level.title}</p>
                <p className="text-xs text-gray-500 mt-1">Level {level.level}</p>
              </div>
              <div className="w-full bg-navy-950 rounded-full h-3 mb-2">
                <div
                  className="bg-gradient-to-r from-gold-dark to-gold-light h-3 rounded-full transition-all duration-700"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{profile?.xp} XP</span>
                {nextLvl && <span>{nextLvl.xp_required} XP</span>}
              </div>
            </>
          )}
          <div className="mt-4 grid grid-cols-2 gap-2 text-center">
            <MiniStat label="Streak" value={`${profile?.streak_days || 0} days`} />
            <MiniStat label="Total Calls" value={profile?.total_calls || 0} />
            <MiniStat label="Total Emails" value={profile?.total_emails || 0} />
            <MiniStat label="Meetings" value={profile?.total_meetings || 0} />
          </div>
        </div>

        {/* Pipeline Funnel */}
        <div className="card col-span-1">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Pipeline</h3>
          <div className="space-y-3">
            <FunnelBar label="New" count={statusCounts['new'] || 0} total={totalLeads} color="bg-status-new" />
            <FunnelBar label="Contacted" count={statusCounts['contacted'] || 0} total={totalLeads} color="bg-status-contacted" />
            <FunnelBar label="Interested" count={statusCounts['interested'] || 0} total={totalLeads} color="bg-status-interested" />
            <FunnelBar label="Client" count={statusCounts['client'] || 0} total={totalLeads} color="bg-status-client" />
            <FunnelBar label="Not Interested" count={statusCounts['not_interested'] || 0} total={totalLeads} color="bg-status-not-interested" />
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card col-span-1">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Recent Activity</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-sm">No activity yet. Start making calls!</p>
            ) : (
              recentActivities.map((a) => (
                <div key={a.id} className="flex items-center gap-2 text-sm py-1.5 border-b border-navy-700 last:border-0">
                  <ActivityIcon type={a.type} />
                  <span className="text-gray-300 truncate flex-1">{a.lead_name || 'Unknown'}</span>
                  <span className="text-xs text-gray-500 capitalize">{a.type.replace('_', ' ')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, Icon, color }: { label: string; value: string | number; Icon: LucideIcon; color: string }) {
  return (
    <div className="card flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg bg-navy-800 flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-navy-950 rounded-lg p-2">
      <p className="text-lg font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}

function FunnelBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-gray-300">{label}</span>
        <span className="text-gray-500">{count}</span>
      </div>
      <div className="w-full bg-navy-950 rounded-full h-2">
        <div className={`${color} h-2 rounded-full transition-all duration-500`} style={{ width: `${Math.max(pct, 2)}%` }} />
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
  return <Icon className="w-4 h-4 text-gray-400" />
}
