/**
 * pricing.ts — Backend pricing types.
 * Mirrors frontend types/pricing.ts; kept in sync manually.
 */

import type { Provider } from './provider';
import type { ParsedRequest } from './parsedRequest';

export interface QuoteLineItem {
  label: string;
  amount: number; // PKR (negative = discount)
  type: 'base' | 'fee' | 'discount' | 'tax';
}

export interface CheaperSlotSuggestion {
  datetime: string; // ISO 8601
  savings: number;  // PKR saved vs current urgency pricing
}

export interface PricingBreakdown {
  line_items: QuoteLineItem[];
  subtotal: number;
  total: number;
  currency: 'PKR';
  cheaper_slot_suggestion?: CheaperSlotSuggestion;
}

/** Body shape for POST /api/quote */
export interface QuoteRequest {
  parsedRequest: ParsedRequest;
  provider: Provider;
  /** Number of past confirmed bookings by this user — for loyalty discount */
  past_booking_count?: number;
}
