import { Router } from 'express';
import { success, error } from '../utils/responseHelpers';
import { calculateQuote } from '../services/pricingEngine';
import type { QuoteRequest } from '../types/pricing';
import { getLLM } from '../llm/llmFactory';

export const quoteRoutes = Router();

quoteRoutes.post('/quote', async (req, res, next) => {
  try {
    const { parsedRequest, provider, past_booking_count = 0 } = req.body as QuoteRequest;
    
    if (!parsedRequest || !provider) {
      return error(res, 'Missing parsedRequest or provider in body', 400);
    }

    const quote = calculateQuote(provider, parsedRequest, { pastBookingCount: past_booking_count });
    try {
      const pricingAgent = await getLLM().reviewQuoteWithTools(parsedRequest, provider, quote);
      quote.pricing_agent = pricingAgent;
    } catch (agentErr) {
      if (process.env.REQUIRE_LIVE_AGENTS === 'true') {
        throw agentErr;
      }
      console.warn('[quoteRoutes] Pricing agent failed; returning transparent quote:', agentErr);
      quote.pricing_agent = {
        tool_trace: [],
        decision: 'keep_quote',
        reasoning: 'Pricing agent unavailable; transparent deterministic quote returned.',
      };
    }
    
    success(res, quote);
  } catch (e) {
    next(e);
  }
});
