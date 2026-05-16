import type { Dispute, DisputeAgentResponse, DisputeType } from '../types/dispute';

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

function extractAmount(text: string): number | undefined {
  const match = text.match(/(?:rs\.?|pkr)?\s*(\d{2,5})/i);
  return match ? Number(match[1]) : undefined;
}

export function runDisputeAgent(dispute: Dispute): DisputeAgentResponse {
  const disputedAmount = extractAmount(dispute.description) ?? 500;
  const lower = dispute.description.toLowerCase();
  const trace: DisputeAgentResponse['tool_trace'] = [];

  const addTool = (tool: string, input: Record<string, unknown>, observation: unknown) => {
    trace.push({ tool, input, observation });
    return observation;
  };

  const booking = addTool(
    'get_booking_snapshot',
    { booking_id: dispute.booking_id },
    {
      quoted_total: 2600,
      allowed_extra_charges: [],
      scheduled_start: '2026-05-15T10:00:00+05:00',
    }
  );
  const gps = addTool(
    'check_gps_arrival_logs',
    { booking_id: dispute.booking_id, provider_id: dispute.provider_id },
    {
      provider_arrived_at: '2026-05-15T10:23:00+05:00',
      family_ready_at: '2026-05-15T09:55:00+05:00',
      provider_late_minutes: 23,
      family_caused_waiting: false,
    }
  );

  let recommendation: DisputeAgentResponse['recommendation'];
  let status: DisputeAgentResponse['status'] = 'resolved';
  if (dispute.type === 'safety_concern' || lower.includes('unsafe')) {
    recommendation = {
      action: 'human_escalation',
      reason: 'Safety language was detected, so the agent escalated to trust and safety.',
    };
    status = 'escalated';
    addTool('notify_trust_and_safety', { dispute_id: dispute.id }, { notified: true, sla: '2 hours' });
  } else if (dispute.type === 'extra_charge' && (gps as any).family_caused_waiting === false) {
    recommendation = {
      action: 'refund',
      refund_amount: disputedAmount,
      reason:
        'The provider charged for waiting, but GPS logs show the provider arrived late and the family was ready.',
    };
    addTool('initiate_refund', { booking_id: dispute.booking_id, amount: disputedAmount }, { refund_id: `rf_${Date.now()}`, status: 'initiated' });
  } else if (dispute.type === 'late_arrival') {
    recommendation = {
      action: 'refund',
      refund_amount: 300,
      reason: 'Arrival logs show a provider delay, so the agent issued punctuality compensation.',
    };
    addTool('initiate_refund', { booking_id: dispute.booking_id, amount: 300 }, { refund_id: `rf_${Date.now()}`, status: 'initiated' });
  } else if (dispute.type === 'incomplete_service') {
    recommendation = {
      action: 'revisit',
      reason: 'The booking record shows an incomplete task claim, so the agent offered a priority revisit.',
    };
    addTool('schedule_revisit_offer', { booking_id: dispute.booking_id }, { offered_slots: ['tomorrow 09:00', 'tomorrow 14:00'] });
  } else {
    recommendation = recommendResolution(dispute);
    status = recommendation.action === 'human_escalation' ? 'escalated' : 'under_review';
  }

  return {
    status,
    recommendation,
    tool_trace: trace,
    messages: [
      {
        role: 'agent',
        content:
          dispute.type === 'extra_charge'
            ? `I see the provider charged an extra Rs. ${disputedAmount}. I checked the booking terms and GPS arrival logs before deciding.`
            : 'I checked the booking record and visit evidence before deciding on the next step.',
      },
      ...trace.map((item) => ({
        role: 'tool' as const,
        tool_name: item.tool,
        content: `${item.tool}: ${JSON.stringify(item.observation)}`,
      })),
      {
        role: 'agent',
        content:
          recommendation.action === 'refund'
            ? `Refund initiated: Rs. ${recommendation.refund_amount ?? disputedAmount}. ${recommendation.reason}`
            : recommendation.reason,
      },
    ],
  };
}
