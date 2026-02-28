import { useEffect } from 'react'
import { useGamificationStore } from '../../stores/gamificationStore'
import IconRenderer from '../icons/IconRenderer'

export default function AchievementToast() {
  const achievement = useGamificationStore((s) => s.achievementUnlocked)
  const dismiss = useGamificationStore((s) => s.dismissAchievement)

  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(dismiss, 5000)
      return () => clearTimeout(timer)
    }
  }, [achievement])

  if (!achievement) return null

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-navy-800 border border-gold/50 rounded-xl p-4 shadow-lg shadow-gold/10 flex items-center gap-3 max-w-sm">
        <IconRenderer name={achievement.icon} size={28} className="text-gold" />
        <div>
          <p className="text-xs text-gold uppercase font-bold tracking-wider">Achievement Unlocked!</p>
          <p className="text-white font-semibold">{achievement.name}</p>
          <p className="text-xs text-gray-400">{achievement.description}</p>
        </div>
      </div>
    </div>
  )
}
