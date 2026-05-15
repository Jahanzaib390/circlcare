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

export const bookingRoutes = Router();

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
    success(res, { booking });
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
    const booking = cancelBooking(req.params.id, reason);
    success(res, { booking });
  } catch (e) {
    if (e instanceof Error && e.message === 'Booking not found') {
      return error(res, 'Booking not found', 404);
    }
    next(e);
  }
});
