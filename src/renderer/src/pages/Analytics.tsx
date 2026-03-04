import { useEffect, useState } from 'react'
import { TrendingUp, BarChart2, Grid3X3, Building, Sparkles, Loader2, RefreshCw } from 'lucide-react'

interface VolumeTrend { date: string; calls: number; emails: number; meetings: number; deals: number }
interface HeatmapCell { day_of_week: number; hour: number; count: number; positive_count: number }
interface IndustryStat { industry: string; lead_count: number; calls: number; positive_outcomes: number; clients: number }
interface Funnel { total_leads: number; contacted: number; interested: number; clients: number; total_calls: number; total_meetings: number }

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Analytics() {
  const [trends, setTrends] = useState<VolumeTrend[]>([])
  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([])
  const [industries, setIndustries] = useState<IndustryStat[]>([])
  const [insights, setInsights] = useState<string[]>([])
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [loading, setLoading] = useState(true)

  const loadData = async () => {
    setLoading(true)
    const [t, f, h, i] = await Promise.all([
      window.api.analytics.getVolumeTrends(30),
      window.api.analytics.getConversionFunnel(),
      window.api.analytics.getCallHeatmap(),
      window.api.analytics.getIndustryStats()
    ])
    setTrends(t); setFunnel(f); setHeatmap(h); setIndustries(i)
    setLoading(false)
  }

  const loadInsights = async () => {
    setInsightsLoading(true)
    try {
      const data = await window.api.analytics.getWeeklyInsights()
      setInsights(data.insights || [])
    } catch (err: any) {
      setInsights([`Error: ${err.message}`])
    }
    setInsightsLoading(false)
  }

  useEffect(() => { loadData() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
          <TrendingUp className="w-4 h-4 text-blue-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">Analytics</h1>
          <p className="text-xs text-gray-500">Your cold calling performance at a glance</p>
        </div>
      </div>

      {/* Conversion Funnel */}
      {funnel && <FunnelChart funnel={funnel} />}

      {/* Volume Trends */}
      <div className="card">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4" /> Call Volume (Last 30 Days)
        </h3>
        <VolumeChart data={trends} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Heatmap */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Grid3X3 className="w-4 h-4" /> Best Time to Call
          </h3>
          <CallHeatmap data={heatmap} />
        </div>

        {/* Industry Performance */}
        <div className="card">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Building className="w-4 h-4" /> Industry Performance
          </h3>
          <IndustryChart data={industries} />
        </div>
      </div>

      {/* AI Weekly Insights */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-gold" /> AI Insights
          </h3>
          <button onClick={loadInsights} disabled={insightsLoading} className="btn-outline text-sm flex items-center gap-1">
            {insightsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
            {insights.length ? 'Refresh' : 'Generate Insights'}
          </button>
        </div>
        {insights.length > 0 ? (
          <ul className="space-y-3">
            {insights.map((insight, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="text-gold font-bold shrink-0">{i + 1}.</span>
                <span className="text-gray-300">{insight}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-sm">Click "Generate Insights" to get AI-powered analysis of your performance.</p>
        )}
      </div>
    </div>
  )
}

function FunnelChart({ funnel }: { funnel: Funnel }) {
  const steps = [
    { label: 'Total Leads', value: funnel.total_leads, color: 'bg-purple-500' },
    { label: 'Contacted', value: funnel.contacted, color: 'bg-blue-500' },
    { label: 'Interested', value: funnel.interested, color: 'bg-green-500' },
    { label: 'Clients', value: funnel.clients, color: 'bg-gold' }
  ]
  const maxVal = Math.max(funnel.total_leads, 1)

  return (
    <div className="card">
      <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Conversion Funnel</h3>
      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={s.label} className="flex items-center gap-3">
            <span className="text-sm text-gray-400 w-24">{s.label}</span>
            <div className="flex-1 bg-navy-900 rounded-full h-6 relative overflow-hidden">
              <div
                className={`${s.color} h-6 rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
                style={{ width: `${Math.max((s.value / maxVal) * 100, 4)}%` }}
              >
                <span className="text-xs text-white font-bold">{s.value}</span>
              </div>
            </div>
            {i > 0 && (
              <span className="text-xs text-gray-500 w-12 text-right">
                {steps[i - 1].value > 0 ? `${Math.round((s.value / steps[i - 1].value) * 100)}%` : '0%'}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function VolumeChart({ data }: { data: VolumeTrend[] }) {
  if (data.length === 0) {
    return <p className="text-gray-500 text-sm">No data yet. Start making calls!</p>
  }

  const maxCalls = Math.max(...data.map((d) => d.calls), 1)
  const w = 600
  const h = 150
  const barWidth = Math.max(Math.floor(w / data.length) - 2, 4)

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-40">
      {data.map((d, i) => {
        const barH = (d.calls / maxCalls) * (h - 20)
        const x = (i / data.length) * w + 1
        return (
          <g key={d.date}>
            <rect
              x={x}
              y={h - 20 - barH}
              width={barWidth}
              height={barH}
              rx={2}
              fill="rgba(59, 130, 246, 0.6)"
            />
            {d.meetings > 0 && (
              <circle cx={x + barWidth / 2} cy={h - 20 - barH - 6} r={3} fill="#EAB308" />
            )}
            {i % 5 === 0 && (
              <text x={x} y={h - 4} fill="#6B7280" fontSize={8} textAnchor="start">
                {d.date.slice(5)}
              </text>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function CallHeatmap({ data }: { data: HeatmapCell[] }) {
  // Build a 7x12 grid (working hours 7am - 6pm)
  const hours = Array.from({ length: 12 }, (_, i) => i + 7)
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  const getCell = (day: number, hour: number) => {
    return data.find((d) => d.day_of_week === day && d.hour === hour)
  }

  return (
    <div className="overflow-x-auto">
      <div className="grid gap-1" style={{ gridTemplateColumns: `40px repeat(${hours.length}, 1fr)` }}>
        {/* Header */}
        <div />
        {hours.map((h) => (
          <div key={h} className="text-center text-xs text-gray-600">{h > 12 ? `${h - 12}p` : `${h}a`}</div>
        ))}

        {/* Rows */}
        {DAY_NAMES.map((name, day) => (
          <>
            <div key={`label-${day}`} className="text-xs text-gray-500 flex items-center">{name}</div>
            {hours.map((hour) => {
              const cell = getCell(day, hour)
              const intensity = cell ? cell.count / maxCount : 0
              return (
                <div
                  key={`${day}-${hour}`}
                  className="aspect-square rounded-sm"
                  style={{
                    backgroundColor: intensity > 0
                      ? `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`
                      : 'rgba(30, 41, 59, 0.5)'
                  }}
                  title={cell ? `${cell.count} calls (${cell.positive_count} positive)` : 'No calls'}
                />
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}

function IndustryChart({ data }: { data: IndustryStat[] }) {
  if (data.length === 0) {
    return <p className="text-gray-500 text-sm">No industry data yet.</p>
  }

  const maxCalls = Math.max(...data.map((d) => d.calls), 1)

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {data.slice(0, 10).map((d) => {
        const rate = d.calls > 0 ? Math.round((d.positive_outcomes / d.calls) * 100) : 0
        return (
          <div key={d.industry} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-28 truncate" title={d.industry}>
              {d.industry?.split(',')[0]?.replace(/[_]/g, ' ') || 'Other'}
            </span>
            <div className="flex-1 bg-navy-900 rounded-full h-4 relative overflow-hidden">
              <div
                className="bg-blue-500/60 h-4 rounded-full"
                style={{ width: `${(d.calls / maxCalls) * 100}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-16 text-right">{rate}% win</span>
          </div>
        )
      })}
    </div>
  )
}
