import { safeHandle } from './ipc-utils'
import { searchPlaces, testApiKey } from '../services/google-places.service'

export function registerSearchIPC(): void {
  safeHandle('search:places', async (_e, query: string, apiKey: string, pageToken?: string) => {
    return searchPlaces(query, apiKey, pageToken)
  })

  safeHandle('search:testApiKey', async (_e, apiKey: string) => {
    return testApiKey(apiKey)
  })
}
