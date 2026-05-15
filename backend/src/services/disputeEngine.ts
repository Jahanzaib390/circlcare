import type { Dispute, DisputeType } from '../types/dispute';

export interface DisputeRecommendation {
  action: 'refund' | 'revisit' | 'human_escalation';
  reason: string;
  refund_amount?: number;
}

export const DISPUTE_TYPES: DisputeType[] = [
  'no_show',
  'late_arrival',
  'extra_charge',
  'incomplete_service',
  'safety_concern',
];

export function recommendResolution(dispute: Dispute): DisputeRecommendation {
  switch (dispute.type) {
    case 'safety_concern':
      return {
        action: 'human_escalation',
        reason: 'Safety concerns require immediate manual review by our trust & safety team.',
      };
    case 'no_show':
      return {
        action: 'refund',
        reason: 'The provider did not arrive. We recommend a full refund for this booking.',
      };
    case 'extra_charge':
      return {
        action: 'refund',
        reason:
          'Unauthorized extra charges are covered by our guarantee. We recommend refunding the disputed amount after receipt review.',
      };
    case 'incomplete_service':
      return {
        action: 'revisit',
        reason:
          'Service was incomplete. We recommend arranging a free revisit or a partial refund.',
      };
    case 'late_arrival':
      return {
        action: 'revisit',
        reason:
          'Late arrival affected the care experience. We recommend a priority revisit or compensation review.',
      };
    default: {
      const exhaustive: never = dispute.type;
      return exhaustive;
    }
  }
}

export function normalizeDisputeType(type: unknown): DisputeType | null {
  if (type === 'incomplete') return 'incomplete_service';
  if (typeof type !== 'string') return null;
  return DISPUTE_TYPES.includes(type as DisputeType) ? (type as DisputeType) : null;
}

export function buildDispute(input: Partial<Dispute> & { type?: unknown }): Dispute | null {
  const type = normalizeDisputeType(input.type);
  if (!type || !input.description || !input.booking_id || !input.provider_id) {
    return null;
  }

  return {
    id: input.id || `dsp_${Date.now()}`,
    booking_id: input.booking_id,
    provider_id: input.provider_id,
    user_id: input.user_id,
    reported_by: input.reported_by ?? input.user_id,
    type,
    description: input.description,
    created_at: input.created_at ?? input.submitted_at ?? new Date().toISOString(),
    submitted_at: input.submitted_at ?? input.created_at ?? new Date().toISOString(),
    status: input.status ?? 'under_review',
  };
}
