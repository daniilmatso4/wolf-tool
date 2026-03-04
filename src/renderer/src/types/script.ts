export interface CallScript {
  id: string
  name: string
  industry: string
  business_type: string
  script_body: string
  usage_count: number
  success_count: number
  created_at: string
  updated_at: string
}

export interface ObjectionEntry {
  id: string
  category: 'price' | 'timing' | 'competition' | 'authority' | 'need' | 'general'
  objection: string
  response: string
  usage_count: number
  success_count: number
  source: 'manual' | 'ai'
  created_at: string
}
