/**
 * useBookingStatus.ts — Phase 4.1b
 * Polls GET /api/bookings/:id/status every 5 seconds.
 * Exposes simulateNextStep() → POST /api/bookings/:id/simulate for demo mode.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import Config from '@/constants/Config';
import { ApiError, apiClient } from '@/services/apiClient';
import { useBookingStore } from '@/hooks/useBookingStore';
import { BOOKING_TIMELINE_STEPS, type BookingStatus } from '@/constants/BookingStatuses';
import type { Booking, BookingTimelineEvent } from '@/types/booking';
import type { MatchResult } from '@/types/match';
import type { PricingBreakdown } from '@/types/pricing';

export interface ReplacementOption {
  match: MatchResult;
  quote: PricingBreakdown;
}

export interface BookingStatusState {
  status: BookingStatus | null;
  timeline: BookingTimelineEvent[];
  provider_eta_minutes?: number;
  family_notified: boolean;
  delay_reason?: string;
  cancellation_reason?: string;
  compensation_discount?: number;
  replacements?: ReplacementOption[];
  isLoading: boolean;
  error: string | null;
}

type StatusResponse = Pick<
  Booking,
  | 'status'
  | 'timeline'
  | 'provider_eta_minutes'
  | 'family_notified'
  | 'delay_reason'
  | 'cancellation_reason'
  | 'compensation_discount'
>;

interface UseBookingStatusOptions {
  /** Set to false to stop polling (e.g. when booking is completed/cancelled) */
  enablePolling?: boolean;
}

export function useBookingStatus(
  bookingId: string | null | undefined,
  options: UseBookingStatusOptions = {}
) {
  const { enablePolling = true } = options;
  const setBooking = useBookingStore((s) => s.setBooking);
  const localBooking = useBookingStore((s) =>
    bookingId ? s.bookings.find((booking) => booking.booking_id === bookingId) : undefined
  );

  const [state, setState] = useState<BookingStatusState>({
    status: null,
    timeline: [],
    family_notified: false,
    isLoading: false,
    error: null,
  });

  const [isSimulating, setIsSimulating] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMounted = useRef(true);

  const fetchStatus = useCallback(async () => {
    if (!bookingId) return;

    try {
      const data = await apiClient.get<StatusResponse>(`/api/bookings/${bookingId}/status`);
      if (!isMounted.current) return;

      setState((prev) => ({
        ...prev,
        status: data.status,
        timeline: data.timeline ?? [],
        provider_eta_minutes: data.provider_eta_minutes,
        family_notified: data.family_notified ?? false,
        delay_reason: data.delay_reason,
        cancellation_reason: data.cancellation_reason,
        compensation_discount: data.compensation_discount,
        isLoading: false,
        error: null,
      }));
    } catch (e) {
      if (!isMounted.current) return;
      if (e instanceof ApiError && e.statusCode === 404 && localBooking) {
        setState((prev) => ({
          ...prev,
          status: localBooking.status,
          timeline: localBooking.timeline ?? [],
          provider_eta_minutes: localBooking.provider_eta_minutes,
          family_notified: localBooking.family_notified ?? false,
          delay_reason: localBooking.delay_reason,
          cancellation_reason: localBooking.cancellation_reason,
          compensation_discount: localBooking.compensation_discount,
          isLoading: false,
          error: null,
        }));
        return;
      }
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: e instanceof Error ? e.message : 'Failed to fetch status',
      }));
    }
  }, [bookingId, localBooking]);

  // Initial load
  useEffect(() => {
    if (!bookingId) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    fetchStatus();
  }, [bookingId, fetchStatus]);

  // Polling — stop when completed/cancelled
  const TERMINAL_STATUSES: BookingStatus[] = [
    'completed',
    'proof_uploaded',
    'feedback_collected',
    'cancelled',
    'disputed',
  ];

  useEffect(() => {
    if (!bookingId || !enablePolling) return;
    if (state.status && TERMINAL_STATUSES.includes(state.status)) return;

    intervalRef.current = setInterval(fetchStatus, Config.bookingStatusPollIntervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, enablePolling, state.status, fetchStatus]);

  // Cleanup on unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const simulateNextStep = useCallback(
    async (mode: 'advance' | 'delay' | 'cancel' = 'advance') => {
      if (!bookingId || isSimulating) return;
      setIsSimulating(true);
      try {
        const response = await apiClient.post<{
          booking: Booking;
          replacements?: ReplacementOption[];
        }>(`/api/bookings/${bookingId}/simulate`, { mode });
        const { booking, replacements } = response;
        if (!isMounted.current) return;

        setBooking(booking);
        setState((prev) => ({
          ...prev,
          status: booking.status,
          timeline: booking.timeline ?? [],
          provider_eta_minutes: booking.provider_eta_minutes,
          family_notified: booking.family_notified ?? false,
          delay_reason: booking.delay_reason,
          cancellation_reason: booking.cancellation_reason,
          compensation_discount: booking.compensation_discount,
          replacements: replacements ?? prev.replacements,
          error: null,
        }));
      } catch (e) {
        if (!isMounted.current) return;
        if (e instanceof ApiError && e.statusCode === 404 && localBooking) {
          const booking = simulateLocalStep(localBooking, mode);
          setBooking(booking);
          setState((prev) => ({
            ...prev,
            status: booking.status,
            timeline: booking.timeline ?? [],
            provider_eta_minutes: booking.provider_eta_minutes,
            family_notified: booking.family_notified ?? false,
            delay_reason: booking.delay_reason,
            cancellation_reason: booking.cancellation_reason,
            compensation_discount: booking.compensation_discount,
            error: null,
          }));
          return;
        }
        setState((prev) => ({
          ...prev,
          error: e instanceof Error ? e.message : 'Simulate failed',
        }));
      } finally {
        if (isMounted.current) setIsSimulating(false);
      }
    },
    [bookingId, isSimulating, localBooking, setBooking]
  );

  return { ...state, isSimulating, simulateNextStep, refetch: fetchStatus };
}

function simulateLocalStep(
  booking: Booking,
  mode: 'advance' | 'delay' | 'cancel' = 'advance'
): Booking {
  const now = new Date().toISOString();
  const next: Booking = {
    ...booking,
    timeline: [...(booking.timeline ?? [])],
  };

  if (mode === 'delay' && next.status === 'en_route') {
    next.provider_eta_minutes = (next.provider_eta_minutes ?? 24) + 15;
    next.delay_reason = 'Traffic delay near the service area';
    next.timeline.push({
      status: 'en_route',
      timestamp: now,
      note: `Provider delayed: ${next.delay_reason}`,
    });
    return next;
  }

  if (mode === 'cancel' && next.status === 'en_route') {
    next.status = 'cancelled';
    next.provider_eta_minutes = undefined;
    next.cancellation_reason = 'Provider cancelled mid-transit. Replacement flow will be offered.';
    next.compensation_discount = next.compensation_discount ?? 500;
    next.timeline.push({
      status: 'cancelled',
      timestamp: now,
      note: next.cancellation_reason,
    });
    return next;
  }

  const currentIndex = BOOKING_TIMELINE_STEPS.indexOf(next.status);
  if (currentIndex === -1 || currentIndex >= BOOKING_TIMELINE_STEPS.length - 1) return next;

  next.status = BOOKING_TIMELINE_STEPS[currentIndex + 1];
  next.timeline.push({
    status: next.status,
    timestamp: now,
    note: LOCAL_STEP_NOTES[next.status],
  });

  if (next.status === 'family_notified') {
    next.family_notified = true;
  } else if (next.status === 'en_route') {
    next.provider_eta_minutes = 24;
  } else if (next.status === 'in_progress' || next.status === 'completed') {
    next.provider_eta_minutes = undefined;
    next.delay_reason = undefined;
  }

  return next;
}

const LOCAL_STEP_NOTES: Partial<Record<BookingStatus, string>> = {
  provider_assigned: 'Provider accepted the visit and confirmed availability',
  family_notified: 'Family group received the care visit details',
  en_route: 'Provider is on the way to the pickup location',
  in_progress: 'Visit has started and care is in progress',
  completed: 'Visit completed successfully',
  proof_uploaded: 'Provider uploaded proof of service',
  feedback_collected: 'Feedback requested from the family',
};
