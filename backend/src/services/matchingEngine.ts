/**
 * matchingEngine.ts — Two-stage provider matching engine.
 *
 * Stage 1: Hard Filters — boolean reject. Gender is ALWAYS a hard reject.
 * Stage 2: Weighted Scoring — configurable per service category.
 *
 * Returns top 3 matches + all filtered-out providers with reasons.
 */

import type { Provider } from '../types/provider';
import type { ParsedRequest, ServiceCategory } from '../types/parsedRequest';
import type { MatchResult, MatchScore, MatchResponse } from '../types/match';
import { haversineKm, estimateTravelTime } from '../utils/haversine';

interface ExistingBooking {
  provider_id: string;
  scheduled_start: string;
  status: string;
}

// ─── Default weight configuration ────────────────────────────────────────────

interface WeightConfig {
  specialization: number;
  availabilityFit: number;
  reliability: number;
  language: number;
  genderComfort: number;
  ratingRecency: number;
  cancellationRisk: number;
  distance: number;
  priceFit: number;
}

const DEFAULT_WEIGHTS: WeightConfig = {
  specialization: 0.2,
  availabilityFit: 0.15,
  reliability: 0.15,
  language: 0.1,
  genderComfort: 0.1,
  ratingRecency: 0.1,
  cancellationRisk: 0.1,
  distance: 0.05,
  priceFit: 0.05,
};

// Service-category-specific weight overrides
const CATEGORY_WEIGHTS: Partial<Record<ServiceCategory, Partial<WeightConfig>>> = {
  home_nurse: {
    genderComfort: 0.15,
    reliability: 0.2,
    specialization: 0.2,
    cancellationRisk: 0.1,
    language: 0.1,
    availabilityFit: 0.1,
    distance: 0.05,
    priceFit: 0.05,
    ratingRecency: 0.05,
  },
  caregiver: {
    genderComfort: 0.15,
    language: 0.15,
    specialization: 0.2,
    reliability: 0.15,
    cancellationRisk: 0.1,
    availabilityFit: 0.1,
    ratingRecency: 0.1,
    distance: 0.03,
    priceFit: 0.02,
  },
  physiotherapy: {
    specialization: 0.25,
    availabilityFit: 0.15,
    reliability: 0.15,
    ratingRecency: 0.15,
    genderComfort: 0.1,
    cancellationRisk: 0.1,
    language: 0.05,
    distance: 0.03,
    priceFit: 0.02,
  },
  clinic_visit: {
    availabilityFit: 0.2,
    distance: 0.1,
    reliability: 0.2,
    specialization: 0.15,
    ratingRecency: 0.1,
    cancellationRisk: 0.1,
    genderComfort: 0.08,
    language: 0.05,
    priceFit: 0.02,
  },
};

/**
 * Merge default weights with category-specific overrides.
 * Uses the first service category in the bundle to determine weights.
 */
function resolveWeights(request: ParsedRequest): WeightConfig {
  const primaryService = request.service_bundle[0] as ServiceCategory | undefined;
  if (!primaryService || !CATEGORY_WEIGHTS[primaryService]) return DEFAULT_WEIGHTS;
  return { ...DEFAULT_WEIGHTS, ...CATEGORY_WEIGHTS[primaryService] };
}

// ─── Lahore area lookup for approximate lat/lng from name ─────────────────────
// Used when we only have a string location, not a GeoPoint

const AREA_CENTROIDS: Record<string, { lat: number; lng: number }> = {
  dha: { lat: 31.482, lng: 74.401 },
  gulberg: { lat: 31.524, lng: 74.359 },
  'model town': { lat: 31.516, lng: 74.345 },
  'johar town': { lat: 31.468, lng: 74.353 },
  'bahria town': { lat: 31.3688, lng: 74.212 },
  cantt: { lat: 31.556, lng: 74.331 },
  'garden town': { lat: 31.512, lng: 74.354 },
  shadman: { lat: 31.525, lng: 74.338 },
  'faisal town': { lat: 31.505, lng: 74.33 },
  ichra: { lat: 31.518, lng: 74.325 },
  lahore: { lat: 31.5204, lng: 74.3587 },
  clifton: { lat: 24.8138, lng: 67.0302 },
  'dha karachi': { lat: 24.7936, lng: 67.0644 },
  'gulshan-e-iqbal': { lat: 24.918, lng: 67.0971 },
  gulshan: { lat: 24.918, lng: 67.0971 },
  nazimabad: { lat: 24.9189, lng: 67.0304 },
  karachi: { lat: 24.8607, lng: 67.0011 },
  'f-7': { lat: 33.7206, lng: 73.0553 },
  'f-8': { lat: 33.7115, lng: 73.0397 },
  'g-9': { lat: 33.6844, lng: 73.0436 },
  'blue area': { lat: 33.7087, lng: 73.0498 },
  islamabad: { lat: 33.6844, lng: 73.0479 },
};

function resolvePatientLocation(locationFrom: string): { lat: number; lng: number; area: string } {
  const lower = locationFrom.toLowerCase().trim();
  for (const [area, coords] of Object.entries(AREA_CENTROIDS)) {
    if (lower.includes(area)) {
      return { ...coords, area: locationFrom };
    }
  }
  // Default to Lahore centroid if area not recognized
  return { lat: 31.5204, lng: 74.3587, area: locationFrom };
}

// ─── Stage 1: Hard Filters ────────────────────────────────────────────────────

interface HardFilterOutcome {
  passed: boolean;
  failedFilter?: string;
  reason?: string;
  suggestedNextSlot?: string;
}

const HIGH_RISK_SERVICES: ServiceCategory[] = ['home_nurse', 'physiotherapy', 'lab_sample'];
const BOOKING_BLOCK_MINUTES = 120;

function minutesFromHHMM(value: string): number {
  const [hour = '0', minute = '0'] = value.split(':');
  return Number(hour) * 60 + Number(minute);
}

function dayKeyFromDateParts(
  year: number,
  month: number,
  day: number
): Provider['availability'][number]['day'] {
  const dayKeys: Provider['availability'][number]['day'][] = [
    'sun',
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
  ];
  return dayKeys[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}

function parseRequestedSlot(
  request: ParsedRequest
):
  | {
      day: Provider['availability'][number]['day'];
      startMinutes: number;
      endMinutes: number;
      label: string;
    }
  | undefined {
  const iso = request.scheduled_datetime;
  if (iso) {
    const match = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (match) {
      const [, y, m, d, hh, mm] = match;
      const startMinutes = Number(hh) * 60 + Number(mm);
      return {
        day: dayKeyFromDateParts(Number(y), Number(m), Number(d)),
        startMinutes,
        endMinutes: startMinutes + BOOKING_BLOCK_MINUTES,
        label: `${hh}:${mm}`,
      };
    }
  }

  const text = request.time_preference.toLowerCase();
  const dayMatch = text.match(
    /\b(mon|monday|tue|tuesday|wed|wednesday|thu|thursday|fri|friday|sat|saturday|sun|sunday)\b/
  );
  const dayLookup: Record<string, Provider['availability'][number]['day']> = {
    mon: 'mon',
    monday: 'mon',
    tue: 'tue',
    tuesday: 'tue',
    wed: 'wed',
    wednesday: 'wed',
    thu: 'thu',
    thursday: 'thu',
    fri: 'fri',
    friday: 'fri',
    sat: 'sat',
    saturday: 'sat',
    sun: 'sun',
    sunday: 'sun',
  };
  const clockMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/);
  if (!dayMatch && !clockMatch) return undefined;

  let startMinutes = 9 * 60;
  if (clockMatch) {
    let hour = Number(clockMatch[1]);
    const minute = Number(clockMatch[2] ?? '0');
    const suffix = clockMatch[3];
    if (suffix === 'pm' && hour < 12) hour += 12;
    if (suffix === 'am' && hour === 12) hour = 0;
    startMinutes = hour * 60 + minute;
  } else if (text.includes('morning')) {
    startMinutes = 9 * 60;
  } else if (text.includes('afternoon')) {
    startMinutes = 14 * 60;
  } else if (text.includes('evening')) {
    startMinutes = 18 * 60;
  }

  return {
    day: dayMatch ? dayLookup[dayMatch[0]] : 'mon',
    startMinutes,
    endMinutes: startMinutes + BOOKING_BLOCK_MINUTES,
    label: request.time_preference,
  };
}

function hasAvailabilitySlot(
  provider: Provider,
  requestedSlot: ReturnType<typeof parseRequestedSlot>
): boolean {
  if (!requestedSlot) return provider.availability.length > 0;

  return provider.availability.some((slot) => {
    if (slot.day !== requestedSlot.day) return false;
    const slotStart = minutesFromHHMM(slot.start_time);
    const slotEnd = minutesFromHHMM(slot.end_time);
    return requestedSlot.startMinutes >= slotStart && requestedSlot.endMinutes <= slotEnd;
  });
}

function hasBookingConflict(
  provider: Provider,
  request: ParsedRequest,
  existingBookings: ExistingBooking[]
): boolean {
  if (!request.scheduled_datetime) return false;
  const requestedStart = new Date(request.scheduled_datetime).getTime();
  if (Number.isNaN(requestedStart)) return false;
  const requestedEnd = requestedStart + BOOKING_BLOCK_MINUTES * 60_000;

  return existingBookings.some((booking) => {
    if (booking.provider_id !== provider.id) return false;
    if (['cancelled', 'completed'].includes(booking.status)) return false;

    const bookingStart = new Date(booking.scheduled_start).getTime();
    if (Number.isNaN(bookingStart)) return false;
    const bookingEnd = bookingStart + BOOKING_BLOCK_MINUTES * 60_000;
    return requestedStart < bookingEnd && requestedEnd > bookingStart;
  });
}

function nextSlotSuggestion(provider: Provider, request: ParsedRequest): string | undefined {
  const requestedStart = request.scheduled_datetime
    ? new Date(request.scheduled_datetime)
    : new Date();
  if (Number.isNaN(requestedStart.getTime())) return undefined;

  const orderedDays: Provider['availability'][number]['day'][] = [
    'sun',
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
  ];
  const requestedDayIndex = requestedStart.getDay();

  for (let offset = 0; offset < 14; offset += 1) {
    const date = new Date(requestedStart);
    date.setDate(requestedStart.getDate() + offset);
    const day = orderedDays[(requestedDayIndex + offset) % 7];
    const slots = provider.availability.filter((slot) => slot.day === day);
    if (slots.length === 0) continue;

    const slot = slots[0];
    const [hour, minute] = slot.start_time.split(':').map(Number);
    date.setHours(hour, minute, 0, 0);
    if (date.getTime() > requestedStart.getTime()) {
      return date.toISOString();
    }
  }

  return undefined;
}

function applyHardFilters(
  provider: Provider,
  request: ParsedRequest,
  existingBookings: ExistingBooking[]
): HardFilterOutcome {
  const prefs = request.provider_preferences;
  const lower = (s: string) => s.toLowerCase();

  // 1. Service type must match
  const requestedServices = request.service_bundle;
  const hasMatchingService = requestedServices.some((s) =>
    provider.services.includes(s as ServiceCategory)
  );
  if (!hasMatchingService) {
    return {
      passed: false,
      failedFilter: 'service_type',
      reason: `Does not offer ${requestedServices.map((s) => s.replace(/_/g, ' ')).join(', ')}`,
    };
  }

  // 2. Area / city match — case-insensitive substring check on provider.areas
  const patientArea = request.location_from.toLowerCase().trim();
  if (patientArea !== 'not specified' && patientArea !== 'flexible') {
    const areaMatch = provider.areas.some(
      (a) => lower(a).includes(patientArea) || patientArea.includes(lower(a))
    );
    if (!areaMatch) {
      // Fall back: check if patient is within service_radius_km using haversine
      const patientGeo = resolvePatientLocation(request.location_from);
      const distance = haversineKm(provider.location, {
        ...patientGeo,
        area: request.location_from,
      });
      if (distance > provider.service_radius_km) {
        return {
          passed: false,
          failedFilter: 'area_coverage',
          reason: `Does not serve ${request.location_from} (${distance.toFixed(1)} km, radius ${provider.service_radius_km} km)`,
        };
      }
    }
  }

  // 3. Provider must be available and not double-booked.
  const requestedSlot = parseRequestedSlot(request);
  if (!hasAvailabilitySlot(provider, requestedSlot)) {
    return {
      passed: false,
      failedFilter: 'availability',
      reason: requestedSlot
        ? `Not available at ${requestedSlot.label}`
        : 'No availability slots listed',
    };
  }
  if (hasBookingConflict(provider, request, existingBookings)) {
    const suggestedNextSlot = nextSlotSuggestion(provider, request);
    return {
      passed: false,
      failedFilter: 'slot_conflict',
      reason: suggestedNextSlot
        ? `Already booked around ${request.time_preference}. Next available slot: ${new Date(suggestedNextSlot).toLocaleString('en-PK', { timeZone: 'Asia/Karachi' })}`
        : `Already booked around ${request.time_preference}`,
      suggestedNextSlot,
    };
  }

  // 4. Home visit required
  const requiresHomeVisit = [
    'home_nurse',
    'caregiver',
    'physiotherapy',
    'lab_sample',
    'meal_plan',
    'daily_support',
    'elder_companion',
    'medicine_pickup',
  ].some((s) => requestedServices.includes(s as ServiceCategory));

  if (requiresHomeVisit && !provider.home_visit) {
    return {
      passed: false,
      failedFilter: 'home_visit',
      reason: 'Does not offer home visits',
    };
  }

  // 4. Gender preference — HARD REJECT (never soft)
  if (prefs.gender === 'female_required' && provider.gender !== 'female') {
    return {
      passed: false,
      failedFilter: 'gender',
      reason: 'Female provider required — male/other provider excluded',
    };
  }
  if (prefs.gender === 'male_required' && provider.gender !== 'male') {
    return {
      passed: false,
      failedFilter: 'gender',
      reason: 'Male provider required — female/other provider excluded',
    };
  }

  // 5. Verified provider required
  const requiresVerified =
    prefs.verified_only ||
    request.risk_level === 'high' ||
    request.service_bundle.some((service) => HIGH_RISK_SERVICES.includes(service));
  if (requiresVerified && !provider.verified) {
    return {
      passed: false,
      failedFilter: 'verification',
      reason: 'Verified provider required — unverified provider excluded',
    };
  }

  // 6. Wheelchair support required
  if (request.mobility_needs.includes('wheelchair') && !provider.wheelchair_support) {
    return {
      passed: false,
      failedFilter: 'wheelchair',
      reason: 'Wheelchair support required — provider does not support wheelchair access',
    };
  }

  // 7. Language filter — hard if any language preference exists
  if (prefs.language_required && prefs.language && prefs.language.length > 0) {
    const providerLangs = provider.languages.map((l) => lower(l));
    const hasLanguageMatch = prefs.language.some((l) => providerLangs.includes(lower(l)));
    if (!hasLanguageMatch) {
      return {
        passed: false,
        failedFilter: 'language',
        reason: `Provider does not speak ${prefs.language.join(', ')}`,
      };
    }
  }

  return { passed: true };
}

// ─── Stage 2: Weighted Scoring ────────────────────────────────────────────────

function scoreSpecialization(provider: Provider, request: ParsedRequest): number {
  if (provider.specializations.length === 0) return 0.3;
  const requestText = [...request.service_bundle, request.patient, ...request.mobility_needs]
    .join(' ')
    .toLowerCase();

  let matches = 0;
  for (const spec of provider.specializations) {
    const specWords = spec.toLowerCase().split(/\s+/);
    if (specWords.some((w) => requestText.includes(w))) matches++;
  }
  return Math.min(1, 0.3 + (matches / provider.specializations.length) * 0.7);
}

function scoreAvailability(provider: Provider): number {
  // Score = ratio of available slots to a full 7-day week
  const totalSlots = provider.availability.length;
  const score = Math.min(1, totalSlots / 7);
  // Also factor in capacity per day
  const capacityScore = Math.min(1, provider.capacity_per_day / 8);
  return score * 0.6 + capacityScore * 0.4;
}

function scoreReliability(provider: Provider): number {
  return provider.on_time_score;
}

function scoreLanguage(provider: Provider, request: ParsedRequest): number {
  const prefs = request.provider_preferences;
  if (!prefs.language || prefs.language.length === 0) return 0.7; // neutral
  const providerLangs = provider.languages.map((l) => l.toLowerCase());
  const matchCount = (prefs.language || []).filter((l) =>
    providerLangs.includes(l.toLowerCase())
  ).length;
  return matchCount / prefs.language.length;
}

function scoreGenderComfort(provider: Provider, request: ParsedRequest): number {
  const pref = request.provider_preferences.gender;
  if (!pref || pref === 'any') return 0.8; // neutral preference
  if (pref === 'female_preferred' && provider.gender === 'female') return 1.0;
  if (pref === 'female_preferred' && provider.gender !== 'female') return 0.4;
  // male_required / female_required already handled by hard filter — shouldn't reach here
  return 0.8;
}

function scoreRatingRecency(provider: Provider): number {
  // Weight recent score 60%, overall rating 40%
  const normalizedRating = provider.rating / 5;
  const normalizedRecent = provider.recent_review_score / 5;
  return normalizedRecent * 0.6 + normalizedRating * 0.4;
}

function scoreCancellationRisk(provider: Provider): number {
  // Lower cancellation rate = higher score
  return 1 - provider.cancellation_rate;
}

function scoreDistance(distanceKm: number, serviceRadius: number): number {
  if (distanceKm <= 0) return 1;
  // Score 1.0 at 0 km, 0.0 at or beyond serviceRadius
  return Math.max(0, 1 - distanceKm / serviceRadius);
}

function scorePriceFit(provider: Provider, urgency: ParsedRequest['urgency']): number {
  // Normalise base rate within realistic PKR ranges (200–5000)
  const priceScore = 1 - Math.min(1, (provider.base_rate - 200) / 4800);
  // Emergency tolerates premium pricing
  if (urgency === 'emergency') return Math.min(1, priceScore + 0.2);
  return priceScore;
}

function computeWeightedScore(
  provider: Provider,
  request: ParsedRequest,
  distanceKm: number,
  weights: WeightConfig
): MatchScore {
  const scores = {
    specialization: scoreSpecialization(provider, request),
    availabilityFit: scoreAvailability(provider),
    reliability: scoreReliability(provider),
    language: scoreLanguage(provider, request),
    genderComfort: scoreGenderComfort(provider, request),
    ratingRecency: scoreRatingRecency(provider),
    cancellationRisk: scoreCancellationRisk(provider),
    distance: scoreDistance(distanceKm, provider.service_radius_km),
    priceFit: scorePriceFit(provider, request.urgency),
  };

  const total =
    scores.specialization * weights.specialization +
    scores.availabilityFit * weights.availabilityFit +
    scores.reliability * weights.reliability +
    scores.language * weights.language +
    scores.genderComfort * weights.genderComfort +
    scores.ratingRecency * weights.ratingRecency +
    scores.cancellationRisk * weights.cancellationRisk +
    scores.distance * weights.distance +
    scores.priceFit * weights.priceFit;

  return { total: Math.min(1, total), ...scores };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Match a parsed request against a list of providers.
 *
 * @param request   - Confirmed ParsedRequest from the understand screen
 * @param providers - Full provider list (from data/providers.json)
 * @param topN      - Number of top matches to return (default 3)
 * @returns MatchResponse with top_matches and filtered_out
 */
export function matchProviders(
  request: ParsedRequest,
  providers: Provider[],
  existingBookings: ExistingBooking[] = [],
  topN = 3
): Omit<MatchResponse, 'request'> & {
  passedProviders: Array<{
    provider: Provider;
    score: MatchScore;
    distance_km: number;
    travel: ReturnType<typeof estimateTravelTime>;
  }>;
} {
  const weights = resolveWeights(request);
  const patientGeo = resolvePatientLocation(request.location_from);

  const filtered_out: Array<{
    provider: Provider;
    reason: string;
    failed_filter?: string;
    suggested_next_slot?: string;
  }> = [];
  const passed: Array<{
    provider: Provider;
    score: MatchScore;
    distance_km: number;
    travel: ReturnType<typeof estimateTravelTime>;
  }> = [];

  for (const provider of providers) {
    const filterResult = applyHardFilters(provider, request, existingBookings);

    if (!filterResult.passed) {
      filtered_out.push({
        provider,
        reason: filterResult.reason ?? 'Did not meet requirements',
        failed_filter: filterResult.failedFilter,
        suggested_next_slot: filterResult.suggestedNextSlot,
      });
      continue;
    }

    const distanceKm = haversineKm(provider.location, {
      ...patientGeo,
      area: request.location_from,
    });
    const travel = estimateTravelTime(distanceKm);
    const score = computeWeightedScore(provider, request, distanceKm, weights);

    passed.push({ provider, score, distance_km: distanceKm, travel });
  }

  // Sort passed providers by total score descending
  passed.sort((a, b) => b.score.total - a.score.total);

  const topMatches: MatchResult[] = passed.slice(0, topN).map((p, index) => ({
    provider: p.provider,
    score: p.score,
    hardFilterResult: { passed: true },
    explanation: undefined, // filled by route after LLM call
    distance_km: p.distance_km,
    travel_time_minutes: p.travel.travel_time_minutes,
    elder_buffer_minutes: p.travel.elder_buffer_minutes,
    suggested_arrival_buffer_minutes: p.travel.suggested_arrival_buffer_minutes,
    rank: index + 1,
  }));

  return {
    top_matches: topMatches,
    filtered_out,
    passedProviders: passed,
  };
}

export function baselineFirstAvailableByDistance(
  request: ParsedRequest,
  providers: Provider[],
  existingBookings: ExistingBooking[] = []
): MatchResult | undefined {
  const patientGeo = resolvePatientLocation(request.location_from);
  const eligible: MatchResult[] = [];
  for (const provider of providers) {
    const filterResult = applyHardFilters(provider, request, existingBookings);
    if (!filterResult.passed) continue;
    const distanceKm = haversineKm(provider.location, {
      ...patientGeo,
      area: request.location_from,
    });
    const travel = estimateTravelTime(distanceKm);
    const score = computeWeightedScore(provider, request, distanceKm, DEFAULT_WEIGHTS);
    eligible.push({
      provider,
      score,
      hardFilterResult: { passed: true },
      distance_km: distanceKm,
      travel_time_minutes: travel.travel_time_minutes,
      elder_buffer_minutes: travel.elder_buffer_minutes,
      suggested_arrival_buffer_minutes: travel.suggested_arrival_buffer_minutes,
      rank: 1,
    });
  }

  eligible.sort((a, b) => a.distance_km - b.distance_km);
  return eligible[0];
}
