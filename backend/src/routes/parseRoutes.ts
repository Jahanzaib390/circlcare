import { Router } from 'express';
import { z } from 'zod';
import { GeminiProvider } from '../llm/geminiProvider';
import { MockProvider } from '../llm/mockProvider';
import type { LLMProvider } from '../llm/llmProvider';
import { success, error } from '../utils/responseHelpers';

export const parseRoutes = Router();

// ── Singleton LLM provider (picked at server start) ───────────────────────────
const geminiKey = process.env.GEMINI_KEY ?? '';
const useMock = !geminiKey || process.env.DEMO_MODE === 'true';

let llmProvider: LLMProvider;
if (useMock) {
  console.log('[LLM] Using MockProvider (no GEMINI_KEY set or DEMO_MODE=true)');
  llmProvider = new MockProvider();
} else {
  console.log('[LLM] Using GeminiProvider');
  llmProvider = new GeminiProvider(geminiKey);
}

// ── Request schema ─────────────────────────────────────────────────────────────
const ParseRequestBody = z.object({
  text: z.string().min(3, 'Request text must be at least 3 characters').max(2000),
  isEmergency: z.boolean().optional().default(false),
});

// ── POST /api/parse-request ────────────────────────────────────────────────────
parseRoutes.post('/parse-request', async (req, res, next) => {
  try {
    const validation = ParseRequestBody.safeParse(req.body);
    if (!validation.success) {
      return error(res, validation.error.errors[0]?.message ?? 'Invalid request body', 400);
    }

    const { text, isEmergency } = validation.data;
    const parsed = await llmProvider.parseRequest(text);
    if (isEmergency) {
      parsed.urgency = 'emergency';
      parsed.risk_level = 'high';
      parsed.confidence = Math.max(parsed.confidence, 0.85);
      parsed.clarification_needed =
        parsed.service_bundle.length === 0 || parsed.location_from === 'not specified';
    }
    return success(res, parsed);
  } catch (e) {
    // API failure → return a safe fallback that triggers manual form on the FE
    console.error('[parse-request] LLM error:', e);
    const fallback = {
      service_bundle: [],
      patient: 'Unknown',
      location_from: 'not specified',
      time_preference: 'flexible',
      mobility_needs: [],
      provider_preferences: { verified_only: false },
      urgency: 'low' as const,
      risk_level: 'low' as const,
      clarification_needed: true,
      clarification_question:
        'We had trouble understanding your request. Could you describe what care is needed?',
      confidence: 0,
    };
    return success(res, fallback);
  }
});
