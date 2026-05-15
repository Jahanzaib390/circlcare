import { create } from 'zustand';
import type { PricingBreakdown } from '@/types/pricing';

interface QuoteState {
  pricing: PricingBreakdown | null;
  isAlternateSlotSelected: boolean;
  setPricing: (pricing: PricingBreakdown | null) => void;
  setAlternateSlotSelected: (selected: boolean) => void;
  clearQuote: () => void;
}

export const useQuoteStore = create<QuoteState>()((set) => ({
  pricing: null,
  isAlternateSlotSelected: false,
  setPricing: (pricing) => set({ pricing, isAlternateSlotSelected: false }),
  setAlternateSlotSelected: (selected) => set({ isAlternateSlotSelected: selected }),
  clearQuote: () => set({ pricing: null, isAlternateSlotSelected: false }),
}));
