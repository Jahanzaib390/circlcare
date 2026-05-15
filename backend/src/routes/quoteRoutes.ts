import { Router } from 'express';
import { success, error } from '../utils/responseHelpers';
import { calculateQuote } from '../services/pricingEngine';
import type { QuoteRequest } from '../types/pricing';

export const quoteRoutes = Router();

quoteRoutes.post('/quote', async (req, res, next) => {
  try {
    const { parsedRequest, provider, past_booking_count = 0 } = req.body as QuoteRequest;
    
    if (!parsedRequest || !provider) {
      return error(res, 'Missing parsedRequest or provider in body', 400);
    }

    const quote = calculateQuote(provider, parsedRequest, { pastBookingCount: past_booking_count });
    
    success(res, quote);
  } catch (e) {
    next(e);
  }
});
