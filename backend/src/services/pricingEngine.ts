/**
 * pricingEngine.ts — Phase 3.1 Pricing Engine
 * Computes transparent pricing quotes based on the provider, request, and distance.
 */

import type { Provider } from '../types/provider';
import type { ParsedRequest } from '../types/parsedRequest';
import type { PricingBreakdown, QuoteLineItem, CheaperSlotSuggestion } from '../types/pricing';
import { haversineKm } from '../utils/haversine';

// ─── Constants ────────────────────────────────────────────────────────────────

const DISTANCE_FEE_PER_KM = 20; // PKR per km
const URGENCY_SURCHARGE = {
  low: 0,
  medium: 0,
  high: 0.15, // 15% extra
  emergency: 0.3, // 30% extra
};
const WAITING_TIME_FEE = 200; // Flat fee for high/emergency immediate dispatch
const LOYALTY_DISCOUNT_PCT = 0.1; // 10% discount
const LOYALTY_THRESHOLD = 3; // Number of past bookings to qualify

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolvePatientLocation(locationFrom: string): { lat: number; lng: number } {
  // Simplistic mock geocoder matching matchingEngine.ts
  const AREA_CENTROIDS: Record<string, { lat: number; lng: number }> = {
    dha: { lat: 31.482, lng: 74.401 },
    gulberg: { lat: 31.524, lng: 74.359 },
    'model town': { lat: 31.516, lng: 74.345 },
    'johar town': { lat: 31.468, lng: 74.353 },
    'bahria town': { lat: 31.3688, lng: 74.212 },
    cantt: { lat: 31.556, lng: 74.331 },
    'garden town': { lat: 31.512, lng: 74.354 },
    shadman: { lat: 31.525, lng: 74.338 },
    'faisal town': { lat: 31.505, lng: 74.33 },
    ichra: { lat: 31.518, lng: 74.325 },
    lahore: { lat: 31.5204, lng: 74.3587 },
    clifton: { lat: 24.8138, lng: 67.0302 },
    'dha karachi': { lat: 24.7936, lng: 67.0644 },
    'gulshan-e-iqbal': { lat: 24.918, lng: 67.0971 },
    gulshan: { lat: 24.918, lng: 67.0971 },
    nazimabad: { lat: 24.9189, lng: 67.0304 },
    karachi: { lat: 24.8607, lng: 67.0011 },
    'f-7': { lat: 33.7206, lng: 73.0553 },
    'f-8': { lat: 33.7115, lng: 73.0397 },
    'g-9': { lat: 33.6844, lng: 73.0436 },
    'blue area': { lat: 33.7087, lng: 73.0498 },
    islamabad: { lat: 33.6844, lng: 73.0479 },
  };
  const lower = locationFrom.toLowerCase().trim();
  for (const [area, coords] of Object.entries(AREA_CENTROIDS)) {
    if (lower.includes(area)) {
      return coords;
    }
  }
  return { lat: 31.5204, lng: 74.3587 };
}

function calculateComplexityFee(provider: Provider, request: ParsedRequest): number {
  let fee = 0;
  // +100 PKR per matching specialization needed
  const requestText = [...request.service_bundle, request.patient, ...request.mobility_needs]
    .join(' ')
    .toLowerCase();
  
  for (const spec of provider.specializations) {
    const specWords = spec.toLowerCase().split(/\s+/);
    if (specWords.some((w) => requestText.includes(w))) {
      fee += 100;
    }
  }
  return Math.min(fee, 500); // Cap at 500 PKR
}

function calculateAddOns(request: ParsedRequest, provider: Provider): QuoteLineItem[] {
  const items: QuoteLineItem[] = [];
  if (request.mobility_needs.includes('wheelchair') && provider.wheelchair_support) {
    items.push({ label: 'Wheelchair Support', amount: 150, type: 'fee' });
  }
  // Could add medicine cost estimates, lab kit fees, etc. based on service_bundle
  return items;
}

/**
 * If the user is paying a high/emergency urgency fee, suggest a cheaper slot.
 * We'll mock this by suggesting "Tomorrow at 09:00 AM".
 */
function getCheaperSlotSuggestion(
  baseAndFees: number,
  urgencySurcharge: number,
  urgency: ParsedRequest['urgency']
): CheaperSlotSuggestion | undefined {
  if (urgency !== 'high' && urgency !== 'emergency') return undefined;

  // Next morning 9 AM
  const nextDay = new Date();
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(9, 0, 0, 0);

  // The savings is exactly the urgency surcharge + waiting time fee (if any)
  const savings = urgencySurcharge + WAITING_TIME_FEE;

  return {
    datetime: nextDay.toISOString(),
    savings,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a transparent pricing quote for a provider match.
 */
export function calculateQuote(
  provider: Provider,
  request: ParsedRequest,
  options:
    | {
        pastBookingCount?: number;
        compensationDiscount?: number;
      }
    | number = {}
): PricingBreakdown {
  const lineItems: QuoteLineItem[] = [];
  const normalizedOptions = typeof options === 'number' ? { pastBookingCount: options } : options;
  const pastBookingCount = normalizedOptions.pastBookingCount ?? 0;
  const compensationDiscount = normalizedOptions.compensationDiscount ?? 0;

  // 1. Base Rate
  lineItems.push({ label: 'Base Visit Fee', amount: provider.base_rate, type: 'base' });

  // 2. Distance Fee
  const patientGeo = resolvePatientLocation(request.location_from);
  const distanceKm = haversineKm(provider.location, { ...patientGeo, area: request.location_from });
  const distanceFee = Math.round(distanceKm * DISTANCE_FEE_PER_KM);
  if (distanceFee > 0) {
    lineItems.push({ label: 'Travel Distance Fee', amount: distanceFee, type: 'fee' });
  }

  // 3. Complexity Fee
  const complexityFee = calculateComplexityFee(provider, request);
  if (complexityFee > 0) {
    lineItems.push({ label: 'Care Complexity Supplement', amount: complexityFee, type: 'fee' });
  }

  // 4. Add-ons
  const addOns = calculateAddOns(request, provider);
  lineItems.push(...addOns);

  // Subtotal before urgency and discounts
  let subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);

  // 5. Urgency Surcharge & Waiting Time (Immediate dispatch)
  let urgencyAmount = 0;
  if (request.urgency === 'high' || request.urgency === 'emergency') {
    urgencyAmount = Math.round(subtotal * URGENCY_SURCHARGE[request.urgency]);
    lineItems.push({ label: `${request.urgency.toUpperCase()} Surcharge`, amount: urgencyAmount, type: 'fee' });
    
    // Flat waiting/priority dispatch fee
    lineItems.push({ label: 'Priority Dispatch Fee', amount: WAITING_TIME_FEE, type: 'fee' });
    subtotal += WAITING_TIME_FEE; // add flat fee to running total before discount
  }
  
  const subtotalWithUrgency = subtotal + urgencyAmount;

  // 6. Loyalty Discount
  let discountAmount = 0;
  if (pastBookingCount >= LOYALTY_THRESHOLD) {
    discountAmount = Math.round(subtotalWithUrgency * LOYALTY_DISCOUNT_PCT);
    lineItems.push({ label: 'CirclCare Loyalty Discount', amount: -discountAmount, type: 'discount' });
  }

  // 7. Cancellation Compensation
  if (compensationDiscount > 0) {
    lineItems.push({ label: 'Cancellation Compensation', amount: -compensationDiscount, type: 'discount' });
    discountAmount += compensationDiscount;
  }

  // Final Total
  const total = subtotalWithUrgency - discountAmount;

  return {
    line_items: lineItems,
    subtotal: subtotalWithUrgency, // subtotal shown usually includes everything except discounts
    total,
    currency: 'PKR',
    cheaper_slot_suggestion: getCheaperSlotSuggestion(subtotal, urgencyAmount, request.urgency),
  };
}
