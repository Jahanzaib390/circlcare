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
  const scheduled_start = request.scheduled_datetime || new Date().toISOString();
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

    return cancelBooking(id, 'Provider cancelled mid-transit. Replacement flow will be offered.');
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

export function cancelBooking(id: string, reason?: string): Booking {
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
  return booking;
}
