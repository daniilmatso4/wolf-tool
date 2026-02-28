export type LeadStatus = 'new' | 'contacted' | 'interested' | 'client' | 'not_interested'
export type LeadPriority = 'low' | 'medium' | 'high'

export interface Lead {
  id: string
  google_place_id?: string
  name: string
  phone?: string
  email?: string
  website?: string
  has_website: boolean
  address?: string
  lat?: number
  lng?: number
  rating?: number
  rating_count?: number
  types?: string
  status: LeadStatus
  priority: LeadPriority
  notes?: string
  owner_name?: string
  owner_title?: string
  owner_phone?: string
  owner_email?: string
  created_at: string
  updated_at: string
}
