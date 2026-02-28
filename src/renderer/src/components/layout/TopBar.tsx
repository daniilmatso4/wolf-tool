import { useEffect, useState } from 'react'
import { getRandomQuote } from '../../lib/quotes'
import { useGamificationStore } from '../../stores/gamificationStore'

export default function TopBar() {
  const [quote, setQuote] = useState(getRandomQuote())
  const profile = useGamificationStore((s) => s.profile)

  useEffect(() => {
    const interval = setInterval(() => setQuote(getRandomQuote()), 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-12 bg-navy-950 border-b border-navy-700 flex items-center justify-between px-5">
      <div className="flex-1 overflow-hidden">
        <p className="text-xs text-gold/70 italic truncate">"{quote}"</p>
      </div>
      <div className="flex items-center gap-4 ml-4">
        {profile && (
          <>
            <span className="text-xs text-gray-400">
              {'\u{1F525}'} {profile.streak_days} day streak
            </span>
            <span className="text-xs font-semibold text-gold">
              {profile.xp} XP
            </span>
          </>
        )}
      </div>
    </header>
  )
}
