export type DisputeType =
  | 'no_show'
  | 'late_arrival'
  | 'extra_charge'
  | 'incomplete_service'
  | 'safety_concern';

export type DisputeRecommendationType = 'refund' | 'revisit' | 'human_escalation';

export interface DisputeRecommendation {
  type: DisputeRecommendationType;
  description: string;
  refund_amount?: number; // PKR, if applicable
}

export interface Dispute {
  id: string;
  booking_id: string;
  user_id: string;
  provider_id: string;
  type: DisputeType;
  description: string;
  submitted_at: string; // ISO 8601
  status: 'open' | 'under_review' | 'resolved' | 'escalated';
  recommendation?: DisputeRecommendation;
  summary?: string; // OpenAI-generated summary
}

