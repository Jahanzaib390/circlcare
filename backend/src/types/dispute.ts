/** Dispute contract used by the API, dispute engine, and LLM summaries. */
export type DisputeType =
  | 'no_show'
  | 'late_arrival'
  | 'extra_charge'
  | 'incomplete_service'
  | 'safety_concern';

export interface Dispute {
  id: string;
  booking_id: string;
  type: DisputeType;
  description: string;
  reported_by?: string;
  user_id?: string;
  provider_id: string;
  created_at?: string;
  submitted_at?: string;
  status?: 'open' | 'under_review' | 'resolved' | 'escalated';
}
