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
      if (process.env.REQUIRE_LIVE_AGENTS === 'true') {
        throw llmErr;
      }
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
    let llm_summary = '';
    try {
      llm_summary = await getLLM().summarizeDispute(dispute);
    } catch (llmErr) {
      if (process.env.REQUIRE_LIVE_AGENTS === 'true') {
        throw llmErr;
      }
      console.warn('[disputeRoutes] Dispute chat LLM summary failed:', llmErr);
    }

    return success(res, {
      dispute_id: dispute.id,
      ...agent,
      llm_summary,
      live_llm_summary_used: Boolean(llm_summary),
      human_agent_notified: agent.recommendation.action === 'human_escalation',
    });
  } catch (e) {
    next(e);
  }
});
