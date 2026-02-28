import { useGamificationStore } from '../stores/gamificationStore'
import { ACHIEVEMENT_DEFS } from '../lib/achievements'

export default function Achievements() {
  const achievements = useGamificationStore((s) => s.achievements)
  const profile = useGamificationStore((s) => s.profile)

  const unlockedCount = achievements.filter((a) => a.unlocked).length
  const categories = ['calls', 'emails', 'meetings', 'deals', 'streak', 'leads'] as const

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gold-gradient">Achievements</h1>
        <span className="text-sm text-gray-400">
          {unlockedCount} / {achievements.length} unlocked
        </span>
      </div>

      {/* Stats summary */}
      {profile && (
        <div className="grid grid-cols-5 gap-3">
          <StatMini label="Total Calls" value={profile.total_calls} />
          <StatMini label="Total Emails" value={profile.total_emails} />
          <StatMini label="Meetings" value={profile.total_meetings} />
          <StatMini label="Deals Closed" value={profile.total_deals} />
          <StatMini label="Streak" value={`${profile.streak_days} days`} />
        </div>
      )}

      {/* Achievement grid by category */}
      {categories.map((cat) => {
        const catAchievements = achievements.filter((a) => {
          const def = ACHIEVEMENT_DEFS.find((d) => d.id === a.id)
          return def?.category === cat
        })
        if (catAchievements.length === 0) return null

        return (
          <div key={cat}>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 capitalize">{cat}</h2>
            <div className="grid grid-cols-3 gap-3">
              {catAchievements.map((a) => {
                const def = ACHIEVEMENT_DEFS.find((d) => d.id === a.id)
                const progress = Math.min(100, def ? (a.progress / def.requirement) * 100 : 0)
                return (
                  <div
                    key={a.id}
                    className={`card transition-all ${a.unlocked ? 'border-gold/30 bg-gold/5' : 'opacity-60'}`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{a.icon || def?.icon}</span>
                      <div>
                        <p className={`font-semibold text-sm ${a.unlocked ? 'text-gold' : 'text-gray-400'}`}>
                          {a.name || def?.name}
                        </p>
                        <p className="text-xs text-gray-500">{a.description || def?.description}</p>
                      </div>
                    </div>
                    <div className="w-full bg-navy-950 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-500 ${a.unlocked ? 'bg-gold' : 'bg-navy-600'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-500">
                        {a.progress} / {def?.requirement}
                      </span>
                      {a.unlocked && a.unlocked_at && (
                        <span className="text-xs text-gold">
                          Unlocked {new Date(a.unlocked_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StatMini({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card text-center">
      <p className="text-xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  )
}
