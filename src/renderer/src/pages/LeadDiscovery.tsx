import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { useSearchStore } from '../stores/searchStore'
import { useLeadsStore } from '../stores/leadsStore'
import { useSettingsStore } from '../stores/settingsStore'
import { useGamificationStore } from '../stores/gamificationStore'
import { formatPlaceTypes } from '../lib/categories'
import type { PlaceResult } from '../types/search'

export default function LeadDiscovery() {
  const [query, setQuery] = useState('')
  const { results, loading, error, nextPageToken, filterNoWebsite, search, loadMore, setFilterNoWebsite, markAsSaved } = useSearchStore()
  const { addLead } = useLeadsStore()
  const apiKey = useSettingsStore((s) => s.settings.google_api_key)
  const logLeadSave = useGamificationStore((s) => s.logLeadSave)

  const handleSearch = async () => {
    if (!query.trim()) return
    if (!apiKey) {
      alert('Please set your Google API key in Settings first.')
      return
    }
    await search(query.trim(), apiKey)
  }

  const handleLoadMore = () => {
    if (apiKey && nextPageToken) loadMore(apiKey)
  }

  const saveLead = async (place: PlaceResult) => {
    const lead = {
      id: uuidv4(),
      google_place_id: place.place_id,
      name: place.name,
      phone: place.phone || null,
      email: null,
      website: place.website || null,
      has_website: place.has_website ? 1 : 0,
      address: place.formatted_address || null,
      lat: place.lat || null,
      lng: place.lng || null,
      rating: place.rating || null,
      rating_count: place.user_ratings_total || null,
      types: place.types?.join(',') || null,
      status: 'new',
      priority: 'medium',
      notes: null
    }
    const created = await window.api.leads.create(lead)
    addLead({ ...created, has_website: !!created.has_website })
    markAsSaved(place.place_id)
    await logLeadSave()

    // Fire-and-forget owner discovery in background if lead has a website
    if (place.website && place.has_website) {
      window.api.owner.discover(created.id, {
        name: created.name,
        phone: created.phone,
        website: created.website,
        has_website: !!created.has_website,
        address: created.address,
        types: created.types
      }).catch(() => { /* Owner discovery failed silently — user can retry from BusinessDetail */ })
    }
  }

  const saveAllNoWebsite = async () => {
    const noWebsiteResults = results.filter((r) => !r.has_website && !r.already_saved)
    for (const place of noWebsiteResults) {
      try {
        await saveLead(place)
      } catch (err) {
        console.error(`Failed to save lead "${place.name}":`, err)
      }
    }
  }

  const filteredResults = filterNoWebsite ? results.filter((r) => !r.has_website) : results
  const noWebsiteCount = results.filter((r) => !r.has_website && !r.already_saved).length

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold gold-gradient">Lead Discovery</h1>
        {noWebsiteCount > 0 && (
          <button onClick={saveAllNoWebsite} className="btn-gold text-sm">
            Save All No-Website ({noWebsiteCount})
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="card">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder='Search businesses... e.g. "restaurants in Austin TX"'
            className="input-field flex-1"
          />
          <button onClick={handleSearch} disabled={loading} className="btn-gold">
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {!apiKey && (
          <p className="text-amber-400 text-sm mt-2">
            {'\u26A0'} No API key set. Go to Settings to configure your Google Places API key.
          </p>
        )}

        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={filterNoWebsite}
              onChange={(e) => setFilterNoWebsite(e.target.checked)}
              className="accent-gold"
            />
            Show only businesses without websites
          </label>
          {results.length > 0 && (
            <span className="text-xs text-gray-500">
              {filteredResults.length} results {filterNoWebsite ? '(filtered)' : ''}
            </span>
          )}
        </div>
      </div>

      {error && (
        <div className="card border-red-500/30 text-red-400 text-sm">{error}</div>
      )}

      {/* Results */}
      {filteredResults.length > 0 && (
        <div className="space-y-3">
          {filteredResults.map((place) => (
            <PlaceCard key={place.place_id} place={place} onSave={() => saveLead(place)} />
          ))}
        </div>
      )}

      {nextPageToken && !loading && (
        <div className="text-center">
          <button onClick={handleLoadMore} className="btn-outline">
            Load More Results
          </button>
        </div>
      )}
    </div>
  )
}

function PlaceCard({ place, onSave }: { place: PlaceResult; onSave: () => void }) {
  return (
    <div className={`card flex items-center gap-4 ${!place.has_website ? 'border-gold/30' : ''}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className="font-semibold text-white truncate">{place.name}</h3>
          {!place.has_website && (
            <span className="status-badge bg-gold/20 text-gold text-[10px] whitespace-nowrap">
              NO WEBSITE - TARGET!
            </span>
          )}
        </div>
        <p className="text-sm text-gray-400 truncate">{place.formatted_address}</p>
        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
          {place.rating && (
            <span>{'\u2B50'} {place.rating} ({place.user_ratings_total})</span>
          )}
          {place.phone && <span>{'\u{1F4DE}'} {place.phone}</span>}
          {place.types && <span>{formatPlaceTypes(place.types)}</span>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {place.has_website && (
          <span className="text-xs text-green-500">Has website</span>
        )}
        {place.already_saved ? (
          <span className="text-xs text-gray-500 px-3 py-1.5 border border-navy-600 rounded-lg">Saved</span>
        ) : (
          <button onClick={onSave} className="btn-gold text-sm">
            Save Lead
          </button>
        )}
      </div>
    </div>
  )
}
