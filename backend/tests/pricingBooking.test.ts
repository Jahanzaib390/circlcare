import { createBooking, simulateNextStep, cancelBooking } from '../src/services/bookingSimulator';
import { calculateQuote } from '../src/services/pricingEngine';
import type { ParsedRequest } from '../src/types/parsedRequest';
import type { Provider } from '../src/types/provider';

const provider: Provider = {
  id: 'provider-test-1',
  name: 'Care Provider',
  provider_type: 'individual',
  gender: 'female',
  services: ['home_nurse'],
  specializations: ['diabetes'],
  languages: ['urdu', 'english'],
  areas: ['lahore'],
  home_visit: true,
  verified: true,
  family_friendly: true,
  wheelchair_support: true,
  rating: 4.8,
  review_count: 42,
  recent_review_score: 4.9,
  on_time_score: 0.96,
  cancellation_rate: 0.02,
  base_rate: 1000,
  hourly_rate: 900,
  experience_years: 7,
  capacity_per_day: 4,
  availability: [{ day: 'mon', start_time: '09:00', end_time: '18:00' }],
  location: { lat: 31.5204, lng: 74.3587, area: 'Lahore' },
  service_radius_km: 20,
  risk_flags: [],
  past_disputes: 0,
};

const request: ParsedRequest = {
  service_bundle: ['home_nurse'],
  patient: 'Ammi needs diabetes support',
  location_from: 'Lahore',
  time_preference: 'Immediately',
  scheduled_datetime: '2026-05-15T15:00:00.000Z',
  mobility_needs: ['wheelchair'],
  provider_preferences: {
    gender: 'female_required',
    language: ['urdu'],
    language_required: true,
    verified_only: true,
  },
  urgency: 'high',
  risk_level: 'medium',
  clarification_needed: false,
  confidence: 0.92,
};

describe('pricing and booking simulator', () => {
  it('returns an itemized quote with urgency, add-ons, loyalty discount, and cheaper slot savings', () => {
    const quote = calculateQuote(provider, request, 3);

    expect(quote.currency).toBe('PKR');
    expect(quote.line_items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: 'Base Visit Fee', amount: 1000, type: 'base' }),
        expect.objectContaining({
          label: 'Care Complexity Supplement',
          amount: 100,
          type: 'fee',
        }),
        expect.objectContaining({ label: 'Wheelchair Support', amount: 150, type: 'fee' }),
        expect.objectContaining({ label: 'HIGH Surcharge', amount: 188, type: 'fee' }),
        expect.objectContaining({ label: 'Priority Dispatch Fee', amount: 200, type: 'fee' }),
        expect.objectContaining({
          label: 'CirclCare Loyalty Discount',
          amount: -164,
          type: 'discount',
        }),
      ])
    );
    expect(quote.subtotal).toBe(1638);
    expect(quote.total).toBe(1474);
    expect(quote.cheaper_slot_suggestion?.savings).toBe(388);
  });

  it('creates a confirmed booking with provider assignment and notification events', () => {
    const quote = calculateQuote(provider, request);
    const { booking, family_notification, reminder_event } = createBooking(
      request,
      provider,
      quote,
      'user-test-1'
    );

    expect(booking.status).toBe('confirmed');
    expect(booking.provider_id).toBe(provider.id);
    expect(booking.family_notified).toBe(true);
    expect(booking.quoted_price).toBe(quote.total);
    expect(booking.timeline[0]).toEqual(
      expect.objectContaining({ status: 'confirmed', note: expect.any(String) })
    );
    expect(family_notification).toEqual(
      expect.objectContaining({
        type: 'booking_created',
        recipient: 'family_group',
        booking_id: booking.booking_id,
        provider_id: provider.id,
      })
    );
    expect(reminder_event).toEqual(
      expect.objectContaining({
        type: 'booking_reminder',
        recipient: 'primary_contact',
        scheduled_for: '2026-05-15T14:00:00.000Z',
        booking_id: booking.booking_id,
      })
    );
  });

  it('advances the live lifecycle and handles transit delay/cancellation simulations', () => {
    const quote = calculateQuote(provider, request);
    const { booking } = createBooking(request, provider, quote, 'user-test-2');

    expect(simulateNextStep(booking.booking_id).status).toBe('provider_assigned');
    expect(simulateNextStep(booking.booking_id).status).toBe('family_notified');

    const enRoute = simulateNextStep(booking.booking_id);
    expect(enRoute.status).toBe('en_route');
    expect(enRoute.provider_eta_minutes).toBe(24);

    const delayed = simulateNextStep(booking.booking_id, 'delay');
    expect(delayed.status).toBe('en_route');
    expect(delayed.provider_eta_minutes).toBe(39);
    expect(delayed.delay_reason).toContain('Traffic');

    const cancelled = simulateNextStep(booking.booking_id, 'cancel');
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.cancellation_reason).toContain('mid-transit');
    expect(cancelled.compensation_discount).toBe(500);
  });

  it('returns a family notification and compensation credit when a provider cancels', () => {
    const quote = calculateQuote(provider, request);
    const { booking } = createBooking(request, provider, quote, 'user-test-3');
    const cancelled = cancelBooking(booking.booking_id, 'Provider cancelled before pickup');

    expect(cancelled.booking.status).toBe('cancelled');
    expect(cancelled.booking.original_request).toEqual(request);
    expect(cancelled.booking.compensation_discount).toBe(500);
    expect(cancelled.family_notification).toEqual(
      expect.objectContaining({
        type: 'provider_cancelled',
        recipient: 'family_group',
        booking_id: booking.booking_id,
        provider_id: provider.id,
      })
    );
  });
});
