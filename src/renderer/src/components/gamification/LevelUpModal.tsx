import { useGamificationStore } from '../../stores/gamificationStore'
import { Rocket } from 'lucide-react'

export default function LevelUpModal() {
  const levelUp = useGamificationStore((s) => s.levelUpPending)
  const dismiss = useGamificationStore((s) => s.dismissLevelUp)

  if (!levelUp) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50" onClick={dismiss}>
      <div
        className="bg-navy-800 border-2 border-gold rounded-2xl p-8 max-w-md w-full mx-4 text-center animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <Rocket className="w-14 h-14 text-gold mx-auto mb-4" />
        <h2 className="text-3xl font-bold gold-gradient mb-2">LEVEL UP!</h2>
        <p className="text-gray-300 mb-4">
          You've reached <span className="text-gold font-bold">Level {levelUp.newLevel}</span>
        </p>
        <p className="text-2xl font-bold text-white mb-6">{levelUp.title}</p>
        <button onClick={dismiss} className="btn-gold text-lg px-8 py-3">
          LET'S GO!
        </button>
      </div>
    </div>
  )
}
