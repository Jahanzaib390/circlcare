import { Router } from 'express';
import { success, error } from '../utils/responseHelpers';
import { getProviders, updateProvider } from '../services/providerData';
import type { Provider } from '../types/provider';

export const providerRoutes = Router();

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

interface ReputationPayload {
  rating?: number;
  on_time_score?: number;
  cancellation_rate?: number;
  checklist?: {
    arrived_on_time?: boolean;
    completed_tasks?: boolean;
    professional_conduct?: boolean;
  };
  complaint_reasons?: string[];
}

function calculateReputationUpdate(
  provider: Provider,
  payload: ReputationPayload
): Partial<Provider> {
  const updates: Partial<Provider> = {};
  const complaints = payload.complaint_reasons ?? [];

  if (typeof payload.rating === 'number') {
    const nextReviewCount = provider.review_count + 1;
    updates.review_count = nextReviewCount;
    updates.rating = Number(
      clamp(
        (provider.rating * provider.review_count + clamp(payload.rating, 1, 5)) / nextReviewCount,
        0,
        5
      ).toFixed(2)
    );
    updates.recent_review_score = Number(
      clamp(provider.recent_review_score * 0.75 + clamp(payload.rating, 1, 5) * 0.25, 0, 5).toFixed(
        2
      )
    );
  }

  if (typeof payload.on_time_score === 'number') {
    updates.on_time_score = clamp(payload.on_time_score, 0, 1);
  } else if (payload.checklist?.arrived_on_time !== undefined || complaints.length > 0) {
    const arrivedOnTime =
      payload.checklist?.arrived_on_time === true &&
      !complaints.includes('late_arrival') &&
      !complaints.includes('no_show');
    const signal = arrivedOnTime ? 1 : 0;
    updates.on_time_score = Number(
      clamp(provider.on_time_score * 0.85 + signal * 0.15, 0, 1).toFixed(2)
    );
  }

  if (typeof payload.cancellation_rate === 'number') {
    updates.cancellation_rate = clamp(payload.cancellation_rate, 0, 1);
  } else if (complaints.length > 0) {
    const severeFailure = complaints.includes('no_show') || complaints.includes('safety_concern');
    const signal = severeFailure ? 1 : 0;
    updates.cancellation_rate = Number(
      clamp(provider.cancellation_rate * 0.9 + signal * 0.1, 0, 1).toFixed(2)
    );
  }

  if (complaints.length > 0) {
    updates.past_disputes = provider.past_disputes + 1;
    if (complaints.includes('safety_concern')) {
      updates.risk_flags = Array.from(new Set([...provider.risk_flags, 'recent_safety_dispute']));
    }
  }

  return updates;
}

providerRoutes.get('/providers', (_req, res) => {
  success(res, getProviders());
});

providerRoutes.get('/providers/:id', (req, res) => {
  const providers = getProviders();
  const p = providers.find((x) => x.id === req.params.id);
  if (!p) return error(res, 'Provider not found', 404);
  success(res, p);
});

providerRoutes.post('/providers/:id/reputation', async (req, res, next) => {
  try {
    const provider = getProviders().find((x) => x.id === req.params.id);
    if (!provider) {
      return error(res, 'Provider not found', 404);
    }

    const updates = calculateReputationUpdate(provider, req.body as ReputationPayload);
    if (Object.keys(updates).length === 0) {
      return error(res, 'No reputation fields supplied', 400);
    }

    const updatedProvider = updateProvider(req.params.id, updates);
    success(res, { updated: true, provider: updatedProvider });
  } catch (e) {
    next(e);
  }
});
