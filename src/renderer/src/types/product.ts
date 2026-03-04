export interface MyProduct {
  id: number
  product_name: string
  company_name: string
  product_type: 'service' | 'software' | 'physical' | 'consulting' | ''
  elevator_pitch: string
  key_benefits: string[]
  target_industries: string[]
  target_business_sizes: string
  price_range: string
  unique_selling_points: string[]
  common_objections: { objection: string; response: string }[]
  competitors: string[]
  ideal_customer_description: string
  website: string
  updated_at: string
}

export type ProductSetupStep = 'basics' | 'benefits' | 'target' | 'objections' | 'competitors'
