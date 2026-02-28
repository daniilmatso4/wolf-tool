export const BUSINESS_CATEGORIES: Record<string, string> = {
  restaurant: 'Restaurant',
  cafe: 'Cafe',
  bar: 'Bar',
  store: 'Store',
  gym: 'Gym / Fitness',
  salon: 'Salon / Spa',
  dentist: 'Dentist',
  doctor: 'Doctor',
  lawyer: 'Lawyer',
  accountant: 'Accountant',
  real_estate_agency: 'Real Estate',
  car_dealer: 'Car Dealer',
  car_repair: 'Auto Repair',
  plumber: 'Plumber',
  electrician: 'Electrician',
  veterinary_care: 'Veterinarian',
  lodging: 'Hotel / Lodging',
  church: 'Church',
  school: 'School',
  moving_company: 'Moving Company',
  painter: 'Painter',
  roofing_contractor: 'Roofing',
  general_contractor: 'General Contractor',
  florist: 'Florist',
  bakery: 'Bakery',
  pharmacy: 'Pharmacy',
  pet_store: 'Pet Store',
  clothing_store: 'Clothing Store',
  jewelry_store: 'Jewelry Store',
  furniture_store: 'Furniture Store'
}

export function formatPlaceTypes(types: string[] | string | undefined): string {
  if (!types) return ''
  const arr = Array.isArray(types) ? types : types.split(',')
  return arr
    .map((t) => BUSINESS_CATEGORIES[t.trim()] || t.trim().replace(/_/g, ' '))
    .filter((t) => t !== 'point of interest' && t !== 'establishment')
    .slice(0, 3)
    .join(', ')
}
