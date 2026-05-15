export interface QuoteLineItem {
  label: string;
  amount: number; // PKR (can be negative for discounts)
  type: 'base' | 'fee' | 'discount' | 'tax';
}

export interface PricingBreakdown {
  line_items: QuoteLineItem[];
  subtotal: number;
  total: number;
  currency: 'PKR';
  cheaper_slot_suggestion?: {
    datetime: string;
    savings: number;
  };
}
