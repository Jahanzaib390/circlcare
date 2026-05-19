import { matchProviders } from '../src/services/matchingEngine';
import type { ParsedRequest } from '../src/types/parsedRequest';
import type { Provider } from '../src/types/provider';

const baseProvider: Provider = {
  id: 'provider-ok',
  name: 'Provider OK',
  provider_type: 'individual',
  gender: 'female',
  services: ['home_nurse'],
  specializations: ['Wound Care'],
  languages: ['Urdu', 'English'],
  areas: ['DHA'],
  home_visit: true,
  verified: true,
  family_friendly: true,
  wheelchair_support: true,
  rating: 4.8,
  review_count: 20,
  recent_review_score: 4.9,
  on_time_score: 0.95,
  cancellation_rate: 0.02,
  base_rate: 2500,
  hourly_rate: 900,
  experience_years: 6,
  capacity_per_day: 4,
  availability: [{ day: 'fri', start_time: '08:00', end_time: '18:00' }],
  location: { lat: 31.482, lng: 74.401, area: 'DHA' },
  service_radius_km: 15,
  risk_flags: [],
  past_disputes: 0,
};

const baseRequest: ParsedRequest = {
  service_bundle: ['home_nurse'],
  patient: 'Mother',
  location_from: 'DHA',
  time_preference: 'Friday 10:00',
  scheduled_datetime: '2026-05-15T10:00:00+05:00',
  mobility_needs: [],
  provider_preferences: {
    gender: 'any',
    verified_only: false,
  },
  urgency: 'medium',
  risk_level: 'medium',
  clarification_needed: false,
  confidence: 0.9,
};

function makeProvider(overrides: Partial<Provider>): Provider {
  return { ...baseProvider, ...overrides };
}

function makeRequest(overrides: Partial<ParsedRequest>): ParsedRequest {
  return {
    ...baseRequest,
    ...overrides,
    provider_preferences: {
      ...baseRequest.provider_preferences,
      ...overrides.provider_preferences,
    },
  };
}

describe('matchProviders hard filters', () => {
  it('hard rejects providers that do not match a required gender', () => {
    const maleProvider = makeProvider({ id: 'male-provider', gender: 'male' });
    const request = makeRequest({
      provider_preferences: { gender: 'female_required', verified_only: false },
    });

    const result = matchProviders(request, [maleProvider]);

    expect(result.top_matches).toHaveLength(0);
    expect(result.filtered_out[0]).toMatchObject({
      provider: expect.objectContaining({ id: 'male-provider' }),
      reason: expect.stringContaining('Female provider required'),
    });
  });

  it('hard rejects unverified providers for high-risk clinical services even when verified_only is false', () => {
    const unverifiedProvider = makeProvider({ id: 'unverified', verified: false });

    const result = matchProviders(baseRequest, [unverifiedProvider]);

    expect(result.top_matches).toHaveLength(0);
    expect(result.filtered_out[0].reason).toContain('Verified provider required');
  });

  it('does not hard reject language preferences unless language_required is true', () => {
    const urduOnlyProvider = makeProvider({ id: 'urdu-only', languages: ['Urdu'] });
    const preferred = makeRequest({
      provider_preferences: {
        verified_only: false,
        language: ['Punjabi'],
        language_required: false,
      },
    });
    const required = makeRequest({
      provider_preferences: {
        verified_only: false,
        language: ['Punjabi'],
        language_required: true,
      },
    });

    expect(matchProviders(preferred, [urduOnlyProvider]).top_matches).toHaveLength(1);
    expect(matchProviders(required, [urduOnlyProvider]).top_matches).toHaveLength(0);
  });

  it('hard rejects providers outside their available slot', () => {
    const morningOnlyProvider = makeProvider({
      availability: [{ day: 'fri', start_time: '08:00', end_time: '11:00' }],
    });
    const afternoonRequest = makeRequest({
      time_preference: 'Friday 16:00',
      scheduled_datetime: '2026-05-15T16:00:00+05:00',
    });

    const result = matchProviders(afternoonRequest, [morningOnlyProvider]);

    expect(result.top_matches).toHaveLength(0);
    expect(result.filtered_out[0].reason).toContain('Not available');
  });

  it('uses explicit time preference when scheduled_datetime disagrees', () => {
    const morningOnlyProvider = makeProvider({
      availability: [{ day: 'fri', start_time: '08:00', end_time: '12:00' }],
    });
    const request = makeRequest({
      time_preference: 'Friday morning 10 am',
      scheduled_datetime: '2026-05-15T15:00:00+05:00',
    });

    const result = matchProviders(request, [morningOnlyProvider]);

    expect(result.top_matches).toHaveLength(1);
  });

  it('hard rejects providers with an active overlapping booking', () => {
    const result = matchProviders(
      baseRequest,
      [baseProvider],
      [
        {
          provider_id: baseProvider.id,
          scheduled_start: '2026-05-15T09:30:00+05:00',
          status: 'confirmed',
        },
      ]
    );

    expect(result.top_matches).toHaveLength(0);
    expect(result.filtered_out[0].reason).toContain('Already booked');
    expect(result.filtered_out[0].failed_filter).toBe('slot_conflict');
    expect(result.filtered_out[0].suggested_next_slot).toBeTruthy();
  });
});
