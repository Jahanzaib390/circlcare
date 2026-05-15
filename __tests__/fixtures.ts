import { Language } from '@/constants/Languages';
import { ServiceCategory } from '@/constants/ServiceCategories';
import type { MatchResponse, MatchResult } from '@/types/match';
import type { ParsedRequest } from '@/types/request';
import type { PricingBreakdown } from '@/types/pricing';
import type { Provider } from '@/types/provider';

export const parsedRequest: ParsedRequest = {
  service_bundle: [ServiceCategory.HomeNurse],
  patient: 'Ammi',
  location_from: 'DHA',
  time_preference: 'Friday 10:00',
  scheduled_datetime: '2026-05-15T10:00:00+05:00',
  mobility_needs: ['wheelchair'],
  provider_preferences: {
    gender: 'female_required',
    language: [Language.Urdu],
    language_required: true,
    verified_only: true,
  },
  urgency: 'high',
  risk_level: 'medium',
  clarification_needed: false,
  confidence: 0.92,
};

export const provider: Provider = {
  id: 'provider-1',
  name: 'Ayesha Khan',
  provider_type: 'individual',
  gender: 'female',
  services: [ServiceCategory.HomeNurse],
  specializations: ['Wound Care'],
  languages: [Language.Urdu, Language.English],
  areas: ['DHA'],
  home_visit: true,
  verified: true,
  family_friendly: true,
  wheelchair_support: true,
  rating: 4.8,
  review_count: 42,
  recent_review_score: 4.9,
  on_time_score: 0.96,
  cancellation_rate: 0.02,
  base_rate: 1200,
  hourly_rate: 900,
  experience_years: 8,
  capacity_per_day: 4,
  availability: [{ day: 'fri', start_time: '08:00', end_time: '18:00' }],
  location: { lat: 31.48, lng: 74.4, area: 'DHA' },
  service_radius_km: 15,
  risk_flags: [],
  past_disputes: 0,
};

export function makeMatch(overrides: Partial<MatchResult> = {}): MatchResult {
  return {
    provider,
    score: {
      total: 0.94,
      specialization: 1,
      availabilityFit: 1,
      reliability: 0.96,
      language: 1,
      genderComfort: 1,
      ratingRecency: 0.95,
      cancellationRisk: 0.98,
      distance: 0.9,
      priceFit: 0.8,
    },
    hardFilterResult: { passed: true },
    explanation: 'Strong clinical fit with verified elder-care experience.',
    distance_km: 3.2,
    travel_time_minutes: 16,
    elder_buffer_minutes: 15,
    suggested_arrival_buffer_minutes: 31,
    rank: 1,
    ...overrides,
  };
}

const alternate = makeMatch();

export const matchResponse: MatchResponse = {
  request: parsedRequest,
  top_matches: [
    makeMatch(),
    makeMatch({
      provider: { ...provider, id: 'provider-2', name: 'CarePlus Nurses' },
      rank: 2,
      score: { ...alternate.score, total: 0.88 },
    }),
  ],
  filtered_out: [
    {
      provider: { ...provider, id: 'provider-3', name: 'Ali Raza', gender: 'male' },
      reason: 'Female provider required for this request.',
      failed_filter: 'gender',
    },
  ],
};

export const pricing: PricingBreakdown = {
  currency: 'PKR',
  line_items: [
    { label: 'Base Visit Fee', amount: 1200, type: 'base' },
    { label: 'Distance Fee', amount: 180, type: 'fee' },
    { label: 'HIGH Surcharge', amount: 207, type: 'fee' },
    { label: 'CirclCare Loyalty Discount', amount: -159, type: 'discount' },
  ],
  subtotal: 1587,
  total: 1428,
  cheaper_slot_suggestion: {
    datetime: '2026-05-16T10:00:00+05:00',
    savings: 387,
  },
};
