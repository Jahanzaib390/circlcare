/** Minimal Dispute type needed by the LLMProvider interface */
export interface Dispute {
  id: string;
  booking_id: string;
  type: 'no_show' | 'late_arrival' | 'extra_charge' | 'incomplete' | 'safety_concern';
  description: string;
  reported_by: string;
  provider_id: string;
  created_at: string;
}
