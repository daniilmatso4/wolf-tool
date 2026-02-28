export interface SearchParams {
  query: string
  radius?: number
  location?: string
}

export interface PlaceResult {
  place_id: string
  name: string
  formatted_address?: string
  phone?: string
  website?: string
  has_website: boolean
  rating?: number
  user_ratings_total?: number
  types?: string[]
  lat?: number
  lng?: number
  already_saved?: boolean
}

export interface SearchState {
  results: PlaceResult[]
  loading: boolean
  error?: string
  nextPageToken?: string
}
