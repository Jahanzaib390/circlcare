import {
  buildDispute,
  normalizeDisputeType,
  recommendResolution,
} from '../src/services/disputeEngine';
import { estimateTravelTime, haversineKm, isWithinServiceRadius } from '../src/utils/haversine';
import type { Dispute } from '../src/types/dispute';

const baseDispute: Dispute = {
  id: 'dsp_test',
  booking_id: 'booking_test',
  provider_id: 'provider_test',
  type: 'extra_charge',
  description: 'Provider asked for 500 PKR more than the quote.',
};

describe('dispute engine', () => {
  it.each([
    ['no_show', 'refund'],
    ['extra_charge', 'refund'],
    ['incomplete_service', 'revisit'],
    ['late_arrival', 'revisit'],
    ['safety_concern', 'human_escalation'],
  ] as const)('recommends %s disputes as %s', (type, action) => {
    expect(recommendResolution({ ...baseDispute, type }).action).toBe(action);
  });

  it('normalizes legacy incomplete dispute type and rejects unknown types', () => {
    expect(normalizeDisputeType('incomplete')).toBe('incomplete_service');
    expect(normalizeDisputeType('billing_confusion')).toBeNull();
    expect(normalizeDisputeType(null)).toBeNull();
  });

  it('builds a complete dispute only when required fields are present', () => {
    const dispute = buildDispute({
      booking_id: 'booking_123',
      provider_id: 'provider_123',
      type: 'incomplete',
      description: 'The visit ended before vitals were checked.',
      user_id: 'user_123',
    } as unknown as Parameters<typeof buildDispute>[0]);

    expect(dispute).toEqual(
      expect.objectContaining({
        booking_id: 'booking_123',
        provider_id: 'provider_123',
        type: 'incomplete_service',
        reported_by: 'user_123',
        status: 'under_review',
      })
    );
    expect(buildDispute({ type: 'no_show', description: 'Missing booking data' })).toBeNull();
  });
});

describe('haversine utilities', () => {
  const dha = { lat: 31.4697, lng: 74.4122, area: 'DHA Lahore' };
  const gulberg = { lat: 31.5204, lng: 74.3587, area: 'Gulberg Lahore' };

  it('calculates straight-line distance accurately enough for local matching', () => {
    expect(haversineKm(dha, gulberg)).toBeCloseTo(7.6, 1);
  });

  it('adds traffic and elder-care buffers to travel estimates', () => {
    expect(estimateTravelTime(7.64)).toEqual({
      distance_km: 7.6,
      travel_time_minutes: 32,
      elder_buffer_minutes: 15,
      suggested_arrival_buffer_minutes: 47,
    });
  });

  it('checks provider service radius using haversine distance', () => {
    expect(isWithinServiceRadius(dha, gulberg, 8)).toBe(true);
    expect(isWithinServiceRadius(dha, gulberg, 5)).toBe(false);
  });
});
