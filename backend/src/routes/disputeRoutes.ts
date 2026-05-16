import { Router } from 'express';
import { success, error } from '../utils/responseHelpers';
import { buildDispute, recommendResolution, runDisputeAgent } from '../services/disputeEngine';
import { getLLM } from '../llm/llmFactory';

export const disputeRoutes = Router();

disputeRoutes.post('/disputes', async (req, res, next) => {
  try {
    const dispute = buildDispute(req.body);
    if (!dispute) {
      return error(res, 'Invalid dispute payload', 400);
    }

    const recommendation = recommendResolution(dispute);

    const llm = getLLM();
    let summary = '';
    try {
      summary = await llm.summarizeDispute(dispute);
    } catch (llmErr) {
      console.warn('[disputeRoutes] LLM summarization failed:', llmErr);
      summary = `Dispute filed for ${dispute.type.replace('_', ' ')}. Our team will review this shortly.`;
    }

    return success(res, {
      dispute: {
        ...dispute,
        recommendation,
        summary,
      },
      dispute_id: dispute.id,
      summary,
      recommendation,
      human_agent_notified: recommendation.action === 'human_escalation',
    });
  } catch (e) {
    next(e);
  }
});

disputeRoutes.post('/disputes/chat', async (req, res, next) => {
  try {
    const dispute = buildDispute({
      ...req.body,
      description: req.body?.message ?? req.body?.description,
    });
    if (!dispute) {
      return error(res, 'Invalid dispute chat payload', 400);
    }

    const agent = runDisputeAgent(dispute);
    return success(res, {
      dispute_id: dispute.id,
      ...agent,
      human_agent_notified: agent.recommendation.action === 'human_escalation',
    });
  } catch (e) {
    next(e);
  }
});
