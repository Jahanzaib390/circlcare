import { Router } from 'express';
import { z } from 'zod';
import { success, error } from '../utils/responseHelpers';
import { getScenarioForRequestText } from '../services/demoScenarioState';
import { getLLM } from '../llm/llmFactory';

export const parseRoutes = Router();

const ParseRequestBody = z.object({
  text: z.string().min(3, 'Request text must be at least 3 characters').max(2000),
  isEmergency: z.boolean().optional().default(false),
});

parseRoutes.post('/parse-request', async (req, res, next) => {
  try {
    const validation = ParseRequestBody.safeParse(req.body);
    if (!validation.success) {
      return error(res, validation.error.errors[0]?.message ?? 'Invalid request body', 400);
    }

    const { text, isEmergency } = validation.data;
    const demoScenario = getScenarioForRequestText(text);
    if (demoScenario?.expected_outputs?.parsed_request) {
      const parsed = { ...demoScenario.expected_outputs.parsed_request };
      if (isEmergency) {
        parsed.urgency = 'emergency';
        parsed.risk_level = 'high';
        parsed.confidence = Math.max(parsed.confidence, 0.85);
      }
      return success(res, parsed);
    }

    const parsed = await getLLM().parseRequest(text);
    if (isEmergency) {
      parsed.urgency = 'emergency';
      parsed.risk_level = 'high';
      parsed.confidence = Math.max(parsed.confidence, 0.85);
      parsed.clarification_needed =
        parsed.service_bundle.length === 0 ||
        parsed.location_from === 'not specified' ||
        parsed.location_from === 'current_location_requested';
    }
    return success(res, parsed);
  } catch (e) {
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
