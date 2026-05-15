import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { success, error } from '../utils/responseHelpers';
import { matchProviders } from '../services/matchingEngine';
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

    // Stage 1 + 2: Hard filters + weighted scoring
    const bookings = loadBookings();
    const matchResult = matchProviders(parsedRequest, providers, bookings);

    if (matchResult.top_matches.length === 0) {
      // No providers passed filters — return structured empty result
      const response: MatchResponse = {
        request: parsedRequest,
        top_matches: [],
        filtered_out: matchResult.filtered_out,
      };
      return success(res, response);
    }

    // Stage 3: OpenAI explanation for top matches (with caching)
    const llm = getLLM();
    const topMatchesWithExplanations: MatchResult[] = await Promise.all(
      matchResult.top_matches.map(async (match) => {
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
    };

    return success(res, response);
  } catch (e) {
    next(e);
  }
});

