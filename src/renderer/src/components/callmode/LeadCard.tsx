import { useCallModeStore } from '../../stores/callModeStore'
import { formatPlaceTypes } from '../../lib/categories'
import { Phone, MapPin, Star, Globe, User, SkipForward, ExternalLink } from 'lucide-react'

export default function LeadCard() {
  const { currentLead, skipLead, queue, currentIndex } = useCallModeStore()

  if (!currentLead) {
    return (
      <div className="card flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-400 text-lg">No more leads in queue</p>
          <p className="text-gray-500 text-sm mt-1">Add more leads or adjust your filters</p>
        </div>
      </div>
    )
  }

  const phoneNumber = currentLead.owner_phone || currentLead.phone

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{currentLead.name}</h3>
          {currentLead.types && (
            <p className="text-sm text-gray-400">{formatPlaceTypes(currentLead.types)}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{currentIndex + 1} / {queue.length}</span>
          <button onClick={skipLead} className="btn-ghost text-xs flex items-center gap-1">
            <SkipForward className="w-3 h-3" /> Skip
          </button>
        </div>
      </div>

      {/* Phone - prominent */}
      {phoneNumber && (
        <a
          href={`tel:${phoneNumber}`}
          className="flex items-center gap-3 bg-green-500/10 border border-green-500/30 rounded-lg p-3 hover:bg-green-500/20 transition-colors"
        >
          <Phone className="w-5 h-5 text-green-400" />
          <div>
            <p className="text-green-400 font-bold text-lg">{phoneNumber}</p>
            <p className="text-xs text-green-400/60">{currentLead.owner_phone ? 'Owner direct' : 'Business line'} — Click to dial</p>
          </div>
          <ExternalLink className="w-4 h-4 text-green-400/40 ml-auto" />
        </a>
      )}

      {/* Lead details */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        {currentLead.owner_name && (
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-gray-400 text-xs">Owner</p>
              <p className="text-white">{currentLead.owner_name}{currentLead.owner_title ? ` (${currentLead.owner_title})` : ''}</p>
            </div>
          </div>
        )}
        {currentLead.address && (
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-gray-500" />
            <div>
              <p className="text-gray-400 text-xs">Location</p>
              <p className="text-white truncate">{currentLead.address}</p>
            </div>
          </div>
        )}
        {currentLead.rating && (
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <div>
              <p className="text-gray-400 text-xs">Rating</p>
              <p className="text-white">{currentLead.rating} ({currentLead.rating_count} reviews)</p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          <div>
            <p className="text-gray-400 text-xs">Website</p>
            <p className={currentLead.has_website ? 'text-white' : 'text-gold'}>
              {currentLead.has_website ? 'Has website' : 'No website'}
            </p>
          </div>
        </div>
      </div>

      {/* Score badges */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2 py-1 rounded ${
          currentLead.priority === 'high' ? 'bg-red-500/20 text-red-400' :
          currentLead.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-gray-500/20 text-gray-400'
        }`}>
          {currentLead.priority}
        </span>
        <span className={`text-xs px-2 py-1 rounded ${
          currentLead.status === 'interested' ? 'bg-green-500/20 text-green-400' :
          currentLead.status === 'contacted' ? 'bg-blue-500/20 text-blue-400' :
          'bg-purple-500/20 text-purple-400'
        }`}>
          {currentLead.status}
        </span>
        {currentLead.follow_up_overdue && (
          <span className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 animate-pulse">OVERDUE</span>
        )}
        {currentLead.follow_up_due && !currentLead.follow_up_overdue && (
          <span className="text-xs px-2 py-1 rounded bg-orange-500/20 text-orange-400">Due Today</span>
        )}
        <span className="text-xs text-gray-500 ml-auto">Score: {currentLead.score}</span>
      </div>
    </div>
  )
}
