import { Router } from 'express';
import { success, error } from '../utils/responseHelpers';
import {
  createBooking,
  getBooking,
  simulateNextStep,
  cancelBooking,
} from '../services/bookingSimulator';
import type { ParsedRequest } from '../types/parsedRequest';
import type { Provider } from '../types/provider';
import type { PricingBreakdown } from '../types/pricing';
import { getProviders } from '../services/providerData';
import { matchProviders } from '../services/matchingEngine';
import { calculateQuote } from '../services/pricingEngine';
import type { MatchResult } from '../types/match';

export const bookingRoutes = Router();

function buildCancellationFallback(booking: ReturnType<typeof cancelBooking>['booking']):
  | Array<{ match: MatchResult; quote: PricingBreakdown }>
  | undefined {
  if (!booking.original_request) return undefined;

  const allProviders = getProviders();
  const availableProviders = allProviders.filter((provider) => provider.id !== booking.provider_id);
  const matchResult = matchProviders(booking.original_request, availableProviders);

  return matchResult.top_matches.map((match) => ({
    match,
    quote: calculateQuote(match.provider, booking.original_request!, {
      compensationDiscount: booking.compensation_discount,
    }),
  }));
}

bookingRoutes.post('/bookings', async (req, res, next) => {
  try {
    const { request, provider, pricing } = req.body as {
      request: ParsedRequest;
      provider: Provider;
      pricing: PricingBreakdown;
    };

    if (!request || !provider || !pricing) {
      return error(res, 'Missing request, provider, or pricing in body', 400);
    }

    const result = createBooking(request, provider, pricing);
    success(res, result);
  } catch (e) {
    next(e);
  }
});

bookingRoutes.get('/bookings/:id', async (req, res, next) => {
  try {
    const booking = getBooking(req.params.id);
    if (!booking) {
      return error(res, 'Booking not found', 404);
    }
    success(res, { booking });
  } catch (e) {
    next(e);
  }
});

bookingRoutes.get('/bookings/:id/status', async (req, res, next) => {
  try {
    const booking = getBooking(req.params.id);
    if (!booking) {
      return error(res, 'Booking not found', 404);
    }
    success(res, {
      status: booking.status,
      timeline: booking.timeline,
      provider_eta_minutes: booking.provider_eta_minutes,
      family_notified: booking.family_notified,
      delay_reason: booking.delay_reason,
      cancellation_reason: booking.cancellation_reason,
      compensation_discount: booking.compensation_discount,
    });
  } catch (e) {
    next(e);
  }
});

bookingRoutes.post('/bookings/:id/simulate', async (req, res, next) => {
  try {
    const { mode = 'advance' } = req.body as { mode?: 'advance' | 'delay' | 'cancel' };
    const booking = simulateNextStep(req.params.id, mode);
    const replacements = mode === 'cancel' ? buildCancellationFallback(booking) : undefined;
    success(res, { booking, replacements });
  } catch (e) {
    if (e instanceof Error && e.message === 'Booking not found') {
      return error(res, 'Booking not found', 404);
    }
    if (
      e instanceof Error &&
      (e.message.includes('Delay can only') || e.message.includes('Mid-transit cancellation'))
    ) {
      return error(res, e.message, 409);
    }
    next(e);
  }
});

bookingRoutes.post('/bookings/:id/cancel', async (req, res, next) => {
  try {
    const { reason } = req.body;
    const { booking, family_notification } = cancelBooking(req.params.id, reason);
    const replacements = buildCancellationFallback(booking);

    success(res, { booking, family_notification, replacements });
  } catch (e) {
    if (e instanceof Error && e.message === 'Booking not found') {
      return error(res, 'Booking not found', 404);
    }
    next(e);
  }
});
