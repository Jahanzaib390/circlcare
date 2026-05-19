/**
 * bookingSimulator.ts — Phase 3.3 Booking Simulator
 * An in-memory store and lifecycle engine for bookings, enabling frontend testing
 * without a real database.
 */

import { randomUUID } from 'crypto';
import type { Booking, BookingNotificationPayload, BookingTimelineEvent } from '../types/booking';
import type { ParsedRequest } from '../types/parsedRequest';
import type { Provider } from '../types/provider';
import type { PricingBreakdown } from '../types/pricing';
import { BOOKING_TIMELINE_STEPS } from '../constants/bookingStatuses';
import {
  hasAny,
  parseClockTime,
  reconcileScheduledDatetimeWithPreference,
} from '../utils/timePreference';

// In-memory "database"
const bookings = new Map<string, Booking>();

const STEP_NOTES: Partial<Record<Booking['status'], string>> = {
  provider_assigned: 'Provider accepted the visit and confirmed availability',
  family_notified: 'Family group received the care visit details',
  en_route: 'Provider is on the way to the pickup location',
  in_progress: 'Visit has started and care is in progress',
  completed: 'Visit completed successfully',
  proof_uploaded: 'Provider uploaded proof of service',
  feedback_collected: 'Feedback requested from the family',
};

function resolveScheduledStart(request: ParsedRequest): string {
  if (request.scheduled_datetime && !Number.isNaN(new Date(request.scheduled_datetime).getTime())) {
    return reconcileScheduledDatetimeWithPreference(
      request.scheduled_datetime,
      request.time_preference
    );
  }

  const preferred = request.time_preference.toLowerCase();
  const pkDate = getPakistanDateParts();
  const explicitClock = parseClockTime(preferred);
  let dayOffset = 1;

  if (hasAny(preferred, ['tomorrow', 'kal'])) {
    dayOffset = 1;
  } else if (hasAny(preferred, ['today', 'aaj'])) {
    dayOffset = 0;
  }

  let hour = 10;
  let minute = 0;
  if (explicitClock) {
    hour = explicitClock.hour;
    minute = explicitClock.minute;
  } else if (hasAny(preferred, ['early morning', 'subah jaldi', 'jaldi subah'])) {
    hour = 8;
  } else if (hasAny(preferred, ['morning', 'subah', 'savera'])) {
    hour = 10;
  } else if (hasAny(preferred, ['late afternoon', 'dopahar baad', 'dopehr baad'])) {
    hour = 15;
  } else if (hasAny(preferred, ['afternoon', 'dopahar', 'dopehr', 'dupehar'])) {
    hour = 13;
  } else if (hasAny(preferred, ['evening', 'shaam', 'sham'])) {
    hour = 17;
  } else if (hasAny(preferred, ['night', 'raat'])) {
    hour = 20;
  }

  let scheduled = pakistanWallTimeToDate(pkDate.year, pkDate.month, pkDate.day + dayOffset, hour, minute);
  if (scheduled.getTime() <= Date.now()) {
    scheduled = pakistanWallTimeToDate(pkDate.year, pkDate.month, pkDate.day + dayOffset + 1, hour, minute);
  }

  return scheduled.toISOString();
}

function getPakistanDateParts(now = new Date()): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
  return { year: value('year'), month: value('month'), day: value('day') };
}

function pakistanWallTimeToDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number
): Date {
  return new Date(Date.UTC(year, month - 1, day, hour - 5, minute, 0, 0));
}

export function getBooking(id: string): Booking | undefined {
  return bookings.get(id);
}

export function createBooking(
  request: ParsedRequest,
  provider: Provider,
  pricing: PricingBreakdown,
  userId = 'demo-user-123'
): {
  booking: Booking;
  family_notification: BookingNotificationPayload;
  reminder_event: BookingNotificationPayload;
} {
  const booking_id = randomUUID();
  const scheduled_start = resolveScheduledStart(request);
  const reminderDate = new Date(scheduled_start);
  reminderDate.setMinutes(reminderDate.getMinutes() - 60);

  // Create the initial timeline event
  const timeline: BookingTimelineEvent[] = [
    {
      status: 'confirmed',
      timestamp: new Date().toISOString(),
      note: 'Booking confirmed and payment authorized',
    },
  ];

  const booking: Booking = {
    booking_id,
    user_id: userId,
    provider_id: provider.id,
    service_bundle: request.service_bundle,
    scheduled_start,
    status: 'confirmed',
    quoted_price: pricing.total,
    pricing_breakdown: [pricing], // Real app might separate initial quote vs final invoice
    risk_level: request.risk_level,
    family_notified: true,
    timeline,
    location_from: request.location_from,
    location_to: request.location_to,
    original_request: request,
  };

  bookings.set(booking_id, booking);

  // Fake family notification payload
  const family_notification: BookingNotificationPayload = {
    type: 'booking_created',
    recipient: 'family_group',
    title: `Care arranged for ${request.patient}`,
    message: `${provider.name} will provide ${request.service_bundle.join(', ')} on ${new Date(scheduled_start).toLocaleString()}`,
    booking_id,
    provider_id: provider.id,
  };

  const reminder_event: BookingNotificationPayload = {
    type: 'booking_reminder',
    recipient: 'primary_contact',
    title: 'Upcoming care visit reminder',
    message: `${provider.name} is scheduled in 60 minutes for ${request.patient}.`,
    scheduled_for: reminderDate.toISOString(),
    booking_id,
    provider_id: provider.id,
  };

  return { booking, family_notification, reminder_event };
}

export type BookingSimulationMode = 'advance' | 'delay' | 'cancel';

export function simulateNextStep(id: string, mode: BookingSimulationMode = 'advance'): Booking {
  const booking = bookings.get(id);
  if (!booking) throw new Error('Booking not found');

  if (mode === 'delay') {
    if (booking.status !== 'en_route') {
      throw new Error('Delay can only be simulated while provider is en route');
    }

    booking.provider_eta_minutes = (booking.provider_eta_minutes ?? 24) + 15;
    booking.delay_reason = 'Traffic delay near the service area';
    booking.timeline.push({
      status: 'en_route',
      timestamp: new Date().toISOString(),
      note: `Provider delayed: ${booking.delay_reason}`,
    });

    bookings.set(id, booking);
    return booking;
  }

  if (mode === 'cancel') {
    if (booking.status !== 'en_route') {
      throw new Error('Mid-transit cancellation can only be simulated while provider is en route');
    }

    const { booking: cancelledBooking } = cancelBooking(
      id,
      'Provider cancelled mid-transit. Replacement flow will be offered.'
    );
    return cancelledBooking;
  }

  const currentIndex = BOOKING_TIMELINE_STEPS.indexOf(booking.status);

  // If already at end or cancelled/disputed, do nothing
  if (currentIndex === -1 || currentIndex >= BOOKING_TIMELINE_STEPS.length - 1) {
    return booking;
  }

  const nextStatus = BOOKING_TIMELINE_STEPS[currentIndex + 1];
  booking.status = nextStatus;

  // Add timeline event
  booking.timeline.push({
    status: nextStatus,
    timestamp: new Date().toISOString(),
    note: STEP_NOTES[nextStatus],
  });

  // Handle specific side effects
  if (nextStatus === 'family_notified') {
    booking.family_notified = true;
  } else if (nextStatus === 'en_route') {
    booking.provider_eta_minutes = 24; // Mock ETA
  } else if (nextStatus === 'in_progress' || nextStatus === 'completed') {
    booking.provider_eta_minutes = undefined;
    booking.delay_reason = undefined;
  }

  bookings.set(id, booking);
  return booking;
}

export function cancelBooking(
  id: string,
  reason?: string
): { booking: Booking; family_notification: BookingNotificationPayload } {
  const booking = bookings.get(id);
  if (!booking) throw new Error('Booking not found');

  booking.status = 'cancelled';
  booking.cancellation_reason = reason;
  booking.provider_eta_minutes = undefined;
  booking.compensation_discount = booking.compensation_discount ?? 500;

  booking.timeline.push({
    status: 'cancelled',
    timestamp: new Date().toISOString(),
    note: reason,
  });

  bookings.set(id, booking);

  const family_notification: BookingNotificationPayload = {
    type: 'provider_cancelled',
    recipient: 'family_group',
    title: 'Provider Cancellation Notice',
    message: `The provider for booking ${id} has cancelled. We are searching for a replacement.`,
    booking_id: id,
    provider_id: booking.provider_id,
  };

  return { booking, family_notification };
}
