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

export interface DisputeAgentMessage {
  role: 'user' | 'agent' | 'tool';
  content: string;
  tool_name?: string;
}

export interface DisputeAgentResponse {
  messages: DisputeAgentMessage[];
  recommendation: {
    action: 'refund' | 'revisit' | 'human_escalation';
    reason: string;
    refund_amount?: number;
  };
  status: 'resolved' | 'under_review' | 'escalated';
  tool_trace: Array<{
    tool: string;
    input: Record<string, unknown>;
    observation: unknown;
  }>;
}
