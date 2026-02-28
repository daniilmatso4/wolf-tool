import { useEffect } from 'react'
import { useGamificationStore } from '../../stores/gamificationStore'

export default function XPNotification() {
  const xpEvents = useGamificationStore((s) => s.xpEvents)
  const clearXPEvent = useGamificationStore((s) => s.clearXPEvent)

  useEffect(() => {
    const timers = xpEvents.map((event) =>
      setTimeout(() => clearXPEvent(event.id), 1500)
    )
    return () => {
      timers.forEach((timer) => clearTimeout(timer))
    }
  }, [xpEvents])

  return (
    <div className="fixed bottom-8 right-8 z-40 pointer-events-none">
      {xpEvents.map((event) => (
        <div key={event.id} className="xp-pop text-gold font-bold text-2xl">
          +{event.amount} XP
        </div>
      ))}
    </div>
  )
}
