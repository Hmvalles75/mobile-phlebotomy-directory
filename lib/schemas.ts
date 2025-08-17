import { z } from 'zod'

export const ServiceSchema = z.enum([
  'At-Home Blood Draw',
  'Corporate Wellness',
  'Pediatric',
  'Geriatric',
  'Fertility/IVF',
  'Specimen Pickup',
  'Lab Partner'
])

export const AvailabilitySchema = z.enum([
  'Weekdays',
  'Weekends', 
  'Evenings',
  '24/7'
])

export const PaymentSchema = z.enum([
  'Cash',
  'Major Insurance',
  'Medicare',
  'HSA/FSA'
])

export const BadgeSchema = z.enum([
  'Certified',
  'Background-Checked',
  'Insured',
  'HIPAA-Compliant'
])

export const CoverageSchema = z.object({
  states: z.array(z.string()),
  cities: z.array(z.string()).optional(),
  regions: z.array(z.string()).optional(), // Regional coverage like "Capital Region", "SF Bay Area"
  zipPrefixes: z.array(z.string()).optional(),
  serviceRadius: z.number().optional() // Miles from main location
})

export const AddressSchema = z.object({
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip: z.string().optional()
})

export const CoordsSchema = z.object({
  lat: z.number(),
  lng: z.number()
})

export const ProviderSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  bookingUrl: z.string().url().optional(),
  description: z.string().optional(),
  services: z.array(ServiceSchema),
  coverage: CoverageSchema,
  address: AddressSchema.optional(),
  coords: CoordsSchema.optional(),
  availability: z.array(AvailabilitySchema).optional(),
  payment: z.array(PaymentSchema).optional(),
  rating: z.number().min(0).max(5).optional(),
  reviewsCount: z.number().min(0).optional(),
  badges: z.array(BadgeSchema).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
})

export const StateSchema = z.object({
  name: z.string(),
  abbr: z.string(),
  slug: z.string()
})

export const CitySchema = z.object({
  name: z.string(),
  state: z.string(),
  stateAbbr: z.string(),
  slug: z.string(),
  population: z.number().optional()
})

export const SearchFiltersSchema = z.object({
  query: z.string().optional(),
  services: z.array(ServiceSchema).optional(),
  availability: z.array(AvailabilitySchema).optional(),
  payment: z.array(PaymentSchema).optional(),
  location: z.string().optional(),
  mobileOnly: z.boolean().optional(),
  insuranceAccepted: z.boolean().optional(),
  sortBy: z.enum(['relevance', 'rating', 'distance', 'name']).default('relevance')
})

export const ClaimRequestSchema = z.object({
  providerId: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  message: z.string().min(10, 'Message must be at least 10 characters')
})

export const SubmitProviderSchema = z.object({
  name: z.string().min(1, 'Business name is required'),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  description: z.string().optional(),
  services: z.array(ServiceSchema),
  address: AddressSchema.optional(),
  availability: z.array(AvailabilitySchema).optional(),
  payment: z.array(PaymentSchema).optional(),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Valid contact email is required')
})

export type Provider = z.infer<typeof ProviderSchema>
export type State = z.infer<typeof StateSchema>
export type City = z.infer<typeof CitySchema>
export type SearchFilters = z.infer<typeof SearchFiltersSchema>
export type ClaimRequest = z.infer<typeof ClaimRequestSchema>
export type SubmitProvider = z.infer<typeof SubmitProviderSchema>
export type Service = z.infer<typeof ServiceSchema>
export type Availability = z.infer<typeof AvailabilitySchema>
export type Payment = z.infer<typeof PaymentSchema>
export type Badge = z.infer<typeof BadgeSchema>