import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { success, error } from '../utils/responseHelpers';
import { baselineFirstAvailableByDistance, matchProviders } from '../services/matchingEngine';
import { getCachedExplanation, setCachedExplanation } from '../utils/explanationCache';
import type { ParsedRequest } from '../types/parsedRequest';
import type { Provider } from '../types/provider';
import type { MatchResponse, MatchResult } from '../types/match';

interface ExistingBooking {
  provider_id: string;
  scheduled_start: string;
  status: string;
}

import { getProviders } from '../services/providerData';
import { getLLM } from '../llm/llmFactory';

// ─── Load provider data ───────────────────────────────────────────────────────
// We load from the shared /data directory at the root of the project.
// Resolve path relative to this file's location (backend/src/routes/).
function resolveDataPath(fileName: string): string {
  const candidates = [
    path.resolve(__dirname, '../../../data', fileName),
    path.resolve(__dirname, '../../data', fileName),
    path.resolve(process.cwd(), '../data', fileName),
    path.resolve(process.cwd(), 'data', fileName),
  ];

  const found = candidates.find((candidate) => fs.existsSync(candidate));
  return found ?? candidates[0];
}

const BOOKINGS_PATH = resolveDataPath('bookings.json');

function loadBookings(): ExistingBooking[] {
  try {
    const raw = fs.readFileSync(BOOKINGS_PATH, 'utf-8');
    return JSON.parse(raw) as ExistingBooking[];
  } catch (err) {
    console.warn('[matchRoutes] Failed to load bookings.json; continuing without conflicts:', err);
    return [];
  }
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const matchRoutes = Router();

/**
 * POST /api/match
 *
 * Body: { parsedRequest: ParsedRequest }
 *
 * Returns MatchResponse:
 *   - top_matches: top 3 providers with scores + OpenAI explanations
 *   - filtered_out: providers that failed hard filters with reasons
 */
matchRoutes.post('/match', async (req, res, next) => {
  try {
    const parsedRequest = req.body?.parsedRequest as ParsedRequest | undefined;

    if (
      !parsedRequest ||
      !parsedRequest.service_bundle ||
      parsedRequest.service_bundle.length === 0
    ) {
      return error(res, 'parsedRequest with at least one service is required', 400);
    }

    // Load providers from memory/JSON
    const providers = getProviders();
    if (providers.length === 0) {
      return error(res, 'Provider data unavailable — cannot perform matching', 503);
    }

    // Stage 1 + 2: tool observations for the routing agent
    const bookings = loadBookings();
    const matchResult = matchProviders(parsedRequest, providers, bookings);
    const baseline = baselineFirstAvailableByDistance(parsedRequest, providers, bookings);

    if (matchResult.top_matches.length === 0) {
      // No providers passed filters — return structured empty result
      const response: MatchResponse = {
        request: parsedRequest,
        top_matches: [],
        filtered_out: matchResult.filtered_out,
      };
      return success(res, response);
    }

    // Stage 3: agentic tool-calling decision over observed candidates
    const llm = getLLM();
    let agentDecision;
    try {
      agentDecision = await llm.selectMatchesWithTools(
        parsedRequest,
        matchResult.top_matches,
        matchResult.filtered_out,
        baseline?.provider.id
      );
    } catch (agentErr) {
      console.warn('[matchRoutes] Agentic matching failed; using ranked candidates:', agentErr);
      agentDecision = {
        selected_provider_ids: matchResult.top_matches.map((match) => match.provider.id),
        reasoning: 'Agent unavailable; returned the safest eligible ranked candidates.',
        adapted_from_baseline: false,
        tool_trace: [],
      };
    }

    const rankedByAgent = agentDecision.selected_provider_ids
      .map((id) => matchResult.top_matches.find((match) => match.provider.id === id))
      .filter((match): match is MatchResult => Boolean(match));
    const remaining = matchResult.top_matches.filter(
      (match) => !agentDecision.selected_provider_ids.includes(match.provider.id)
    );
    const agentRankedMatches = [...rankedByAgent, ...remaining].slice(0, 3).map((match, index) => ({
      ...match,
      rank: index + 1,
      agent_reasoning: index === 0 ? agentDecision.reasoning : undefined,
    }));

    // Stage 4: OpenAI explanation for top matches (with caching)
    const topMatchesWithExplanations: MatchResult[] = await Promise.all(
      agentRankedMatches.map(async (match) => {
        // Check cache first
        const cached = getCachedExplanation(parsedRequest, match.provider.id);
        if (cached) {
          return { ...match, explanation: cached };
        }

        try {
          const explanation = await llm.explainMatch(
            parsedRequest,
            match.provider as any, // provider type compatible
            match.score.total
          );
          // Cache for future requests
          setCachedExplanation(parsedRequest, match.provider.id, explanation);
          return { ...match, explanation };
        } catch (llmErr) {
          console.warn(`[matchRoutes] LLM explanation failed for ${match.provider.id}:`, llmErr);
          // Fallback explanation on LLM error
          return {
            ...match,
            explanation: `${match.provider.name} has a ${(match.score.total * 100).toFixed(0)}% match score, rated ${match.provider.rating}/5 with ${(match.provider.on_time_score * 100).toFixed(0)}% on-time rate.`,
          };
        }
      })
    );

    const response: MatchResponse = {
      request: parsedRequest,
      top_matches: topMatchesWithExplanations,
      filtered_out: matchResult.filtered_out,
      agent_trace: agentDecision.tool_trace,
      agent_decision: {
        selected_provider_ids: agentDecision.selected_provider_ids,
        reasoning: agentDecision.reasoning,
        adapted_from_baseline: agentDecision.adapted_from_baseline,
      },
      baseline_comparison: {
        baseline_provider_id: baseline?.provider.id,
        baseline_rule: 'first eligible provider by distance',
        agent_provider_id: topMatchesWithExplanations[0]?.provider.id,
        why_agent_better:
          baseline?.provider.id && topMatchesWithExplanations[0]?.provider.id !== baseline.provider.id
            ? 'The agent adapted beyond distance-only routing by considering strict family preferences, verification, reliability, and cancellation risk.'
            : 'The agent agreed with the distance baseline after checking preferences, risk, and availability.',
      },
    };

    return success(res, response);
  } catch (e) {
    next(e);
  }
});

