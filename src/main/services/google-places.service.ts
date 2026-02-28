import { net } from 'electron'

interface PlaceResult {
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
}

interface PlaceSearchResponse {
  results: PlaceResult[]
  nextPageToken?: string
  error?: string
}

function httpPost(url: string, body: object, headers: Record<string, string>): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request({ url, method: 'POST' })
    for (const [key, val] of Object.entries(headers)) {
      request.setHeader(key, val)
    }
    let data = ''
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk.toString()
      })
      response.on('end', () => resolve(data))
    })
    request.on('error', (err) => reject(err))
    request.write(JSON.stringify(body))
    request.end()
  })
}

function httpGet(url: string, headers: Record<string, string> = {}): Promise<string> {
  return new Promise((resolve, reject) => {
    const request = net.request(url)
    for (const [key, val] of Object.entries(headers)) {
      request.setHeader(key, val)
    }
    let data = ''
    request.on('response', (response) => {
      response.on('data', (chunk) => {
        data += chunk.toString()
      })
      response.on('end', () => resolve(data))
    })
    request.on('error', (err) => reject(err))
    request.end()
  })
}

export async function searchPlaces(
  query: string,
  apiKey: string,
  pageToken?: string
): Promise<PlaceSearchResponse> {
  try {
    // Use Places API (New) - Text Search
    const url = 'https://places.googleapis.com/v1/places:searchText'
    const body: Record<string, unknown> = {
      textQuery: query,
      pageSize: 20
    }
    if (pageToken) {
      body.pageToken = pageToken
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.types,places.location,nextPageToken'
    }

    const raw = await httpPost(url, body, headers)
    const data = JSON.parse(raw)

    if (data.error) {
      return { results: [], error: `Google API error: ${data.error.message || JSON.stringify(data.error)}` }
    }

    const places = data.places || []
    const results: PlaceResult[] = places.map((p: Record<string, unknown>) => {
      const loc = p.location as { latitude?: number; longitude?: number } | undefined
      const displayName = p.displayName as { text?: string } | undefined
      const website = p.websiteUri as string | undefined
      return {
        place_id: p.id as string,
        name: displayName?.text || '',
        formatted_address: p.formattedAddress as string | undefined,
        phone: p.nationalPhoneNumber as string | undefined,
        website: website || undefined,
        has_website: !!website,
        rating: p.rating as number | undefined,
        user_ratings_total: p.userRatingCount as number | undefined,
        types: p.types as string[] | undefined,
        lat: loc?.latitude,
        lng: loc?.longitude
      }
    })

    return {
      results,
      nextPageToken: data.nextPageToken
    }
  } catch (err) {
    return { results: [], error: `Network error: ${(err as Error).message}` }
  }
}

export async function testApiKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const url = 'https://places.googleapis.com/v1/places:searchText'
    const body = { textQuery: 'test', pageSize: 1 }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'places.id'
    }

    const raw = await httpPost(url, body, headers)
    const data = JSON.parse(raw)

    if (data.error) {
      return { valid: false, error: data.error.message || 'API key denied' }
    }
    return { valid: true }
  } catch (err) {
    return { valid: false, error: (err as Error).message }
  }
}
