import { NavLink } from 'react-router-dom'
import { useGamificationStore } from '../../stores/gamificationStore'
import { useAuthStore } from '../../stores/authStore'
import { getLevelForXP, getXPProgress } from '../../lib/levels'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '\u{1F4CA}', premium: false },
  { path: '/discover', label: 'Lead Discovery', icon: '\u{1F50D}', premium: false },
  { path: '/pipeline', label: 'Pipeline', icon: '\u{1F4CB}', premium: false },
  { path: '/agents', label: 'AI Agents', icon: '\u{1F916}', premium: true },
  { path: '/achievements', label: 'Achievements', icon: '\u{1F3C6}', premium: false },
  { path: '/settings', label: 'Settings', icon: '\u2699\uFE0F', premium: false }
]

export default function Sidebar() {
  const profile = useGamificationStore((s) => s.profile)
  const { user, license, signOut } = useAuthStore()
  const level = profile ? getLevelForXP(profile.xp) : null
  const progress = profile ? getXPProgress(profile.xp) : null

  return (
    <aside className="w-64 bg-navy-950 border-r border-navy-700 flex flex-col">
      {/* Logo */}
      <div className="p-5 border-b border-navy-700">
        <h1 className="text-xl font-bold gold-gradient">WOLF TOOL</h1>
        <p className="text-xs text-gray-500 mt-1">tekta.ai Sales Engine</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-5 py-3 text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-gold/10 text-gold border-r-2 border-gold'
                  : 'text-gray-400 hover:text-white hover:bg-navy-800'
              }`
            }
          >
            <span className="text-lg">{item.icon}</span>
            <span className="flex-1">{item.label}</span>
            {item.premium && license.tier !== 'premium' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gold/20 text-gold font-semibold">PRO</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Level card */}
      {profile && level && progress && (
        <div className="p-4 border-t border-navy-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-400">Level {level.level}</span>
            <span className="text-xs text-gold font-semibold">{level.title}</span>
          </div>
          <div className="w-full bg-navy-800 rounded-full h-2 mb-1">
            <div
              className="bg-gradient-to-r from-gold-dark to-gold h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 text-right">
            {profile.xp} XP
          </div>
        </div>
      )}

      {/* User account */}
      {user && (
        <div className="p-4 border-t border-navy-700">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-gold/20 flex items-center justify-center text-xs text-gold font-bold">
              {(user.user_metadata?.full_name || user.email || '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white truncate">
                {user.user_metadata?.full_name || user.email}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              license.tier === 'premium'
                ? 'bg-gold/20 text-gold'
                : 'bg-navy-800 text-gray-400'
            }`}>
              {license.tier === 'premium' ? 'Premium' : 'Free'}
            </span>
            <button
              onClick={signOut}
              className="text-xs text-gray-500 hover:text-red-400 transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
