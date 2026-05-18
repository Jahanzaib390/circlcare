import OpenAI from 'openai';
import type { LLMProvider } from './llmProvider';
import type { ParsedRequest } from '../types/parsedRequest';
import type { Provider } from '../types/provider';
import type { Dispute } from '../types/dispute';
import type { MatchResult, MatchResponse } from '../types/match';
import type { PricingBreakdown } from '../types/pricing';

const DEFAULT_OPENAI_MODEL = 'gpt-5.4-mini';

const PARSE_REQUEST_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    service_bundle: {
      type: 'array',
      items: {
        type: 'string',
        enum: [
          'clinic_visit',
          'home_nurse',
          'caregiver',
          'physiotherapy',
          'medicine_pickup',
          'lab_sample',
          'meal_plan',
          'daily_support',
          'elder_companion',
        ],
      },
    },
    patient: { type: 'string' },
    location_from: { type: 'string' },
    location_to: { type: ['string', 'null'] },
    time_preference: { type: 'string' },
    scheduled_datetime: { type: ['string', 'null'] },
    mobility_needs: { type: 'array', items: { type: 'string' } },
    provider_preferences: {
      type: 'object',
      additionalProperties: false,
      properties: {
        gender: {
          type: ['string', 'null'],
          enum: ['female_required', 'male_required', 'female_preferred', 'any', null],
        },
        language: {
          type: ['array', 'null'],
          items: {
            type: 'string',
            enum: ['Urdu', 'English', 'Punjabi', 'Sindhi', 'Pashto', 'Balochi', 'Saraiki', 'Hindko'],
          },
        },
        language_required: { type: ['boolean', 'null'] },
        verified_only: { type: 'boolean' },
        elder_care_experience: { type: ['boolean', 'null'] },
      },
      required: [
        'gender',
        'language',
        'language_required',
        'verified_only',
        'elder_care_experience',
      ],
    },
    urgency: { type: 'string', enum: ['low', 'medium', 'high', 'emergency'] },
    risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
    recurring: {
      type: ['object', 'null'],
      additionalProperties: false,
      properties: {
        frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
        days_of_week: { type: ['array', 'null'], items: { type: 'number' } },
        end_date: { type: ['string', 'null'] },
      },
      required: ['frequency', 'days_of_week', 'end_date'],
    },
    clarification_needed: { type: 'boolean' },
    clarification_question: { type: ['string', 'null'] },
    confidence: { type: 'number' },
  },
  required: [
    'service_bundle',
    'patient',
    'location_from',
    'location_to',
    'time_preference',
    'scheduled_datetime',
    'mobility_needs',
    'provider_preferences',
    'urgency',
    'risk_level',
    'recurring',
    'clarification_needed',
    'clarification_question',
    'confidence',
  ],
};

const SYSTEM_INSTRUCTION = `You are CirclCare AI, an elder-care coordination assistant operating in Pakistan.

Parse a natural language care request from a family member into the requested JSON schema.

Rules:
- service_bundle must contain only valid category values.
- If urgency is "emergency", set risk_level to "high" and confidence to 1.0.
- If the request is ambiguous (missing service type, location, or time), set clarification_needed: true, confidence < 0.7, and provide a concise clarification_question.
- Ask about only the missing field. If time is missing but service, location, and provider gender are known, ask only when the visit is needed.
- Preserve natural time phrases in time_preference, including Roman Urdu such as "subah", "dopahar/dopehr", "shaam/sham", "raat", "aaj", and "kal"; the booking engine will map them to concrete slots.
- Do not ask for patient age because this schema and app do not include an age field. Ask for the patient relationship/name only when that is needed for routing.
- Never ask for a female/male provider preference when the request already states it; reflect it in provider_preferences.gender instead.
- If a location name is city-ambiguous in Pakistan, do not assume the city. Mark clarification_needed: true, keep location_from as the ambiguous area, set confidence < 0.7, and ask which city. Ambiguous examples include "DHA", "Bahria Town", "Cantt", "Gulberg", and "Model Town" when no city is stated. Clear examples include "DHA Lahore", "DHA Karachi", "Bahria Town Lahore", "F-8 Islamabad", and "Clifton Karachi".
- verified_only defaults to true for clinical services: home_nurse, lab_sample, physiotherapy.
- If a female provider is explicitly requested, set gender to "female_required" as a hard constraint.
- If the family says a provider must speak a language or cannot proceed without it, set language_required: true. Otherwise language is a preference for scoring.
- Extract patient as the person receiving care, not the caller.
- If location is not specified, set location_from to "not specified" and clarification_needed: true.
- If the family asks for "near me", "nearby", "qareeb", "qareeb me", "mere qareeb", or current-location-based help, set location_from to "current_location_requested", set clarification_needed: true, confidence < 0.7, and ask for permission to use current location. If they ask to go to a nearby clinic/hospital/doctor, set location_to to "nearby clinic".
- Use null for unknown optional fields.`;

function getResponseText(response: any): string {
  if (typeof response.output_text === 'string' && response.output_text.trim()) {
    return response.output_text;
  }

  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (content.type === 'output_text' && typeof content.text === 'string') {
        return content.text;
      }
    }
  }

  throw new Error('OpenAI response did not include output text');
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;
  private modelName: string;

  constructor(apiKey: string, modelName = DEFAULT_OPENAI_MODEL) {
    this.client = new OpenAI({ apiKey });
    this.modelName = modelName;
  }

  async parseRequest(input: string): Promise<ParsedRequest> {
    const response = await this.client.responses.create({
      model: this.modelName,
      input: [
        { role: 'system', content: SYSTEM_INSTRUCTION },
        { role: 'user', content: input },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'parsed_care_request',
          strict: true,
          schema: PARSE_REQUEST_SCHEMA,
        },
      },
    } as any);

    const parsed = JSON.parse(getResponseText(response)) as ParsedRequest;

    if (parsed.confidence < 0.7 && !parsed.clarification_needed) {
      parsed.clarification_needed = true;
      parsed.clarification_question ??=
        'Could you clarify what type of care is needed and the preferred location?';
    }

    return parsed;
  }

  async explainMatch(request: ParsedRequest, provider: Provider, score: number): Promise<string> {
    const response = await this.client.responses.create({
      model: this.modelName,
      input: [
        {
          role: 'system',
          content:
            'Write concise, reassuring elder-care marketplace copy. Do not mention internal scoring formulas.',
        },
        {
          role: 'user',
          content: `Write a 2-3 sentence explanation of why this provider is recommended.

Request: ${JSON.stringify({ services: request.service_bundle, urgency: request.urgency, preferences: request.provider_preferences })}
Provider: ${JSON.stringify({ name: provider.name, services: provider.services, rating: provider.rating, on_time_score: provider.on_time_score, verified: provider.verified, specializations: provider.specializations })}
Match score: ${(score * 100).toFixed(0)}%

Be specific and mention 2-3 concrete reasons. Do not start with "I".`,
        },
      ],
      max_output_tokens: 180,
    } as any);

    return getResponseText(response).trim();
  }

  async selectMatchesWithTools(
    request: ParsedRequest,
    candidates: MatchResult[],
    filteredOut: MatchResponse['filtered_out'],
    baselineProviderId?: string
  ) {
    const toolTrace: Array<{ tool: string; input: Record<string, unknown>; observation: unknown }> = [];
    const toolHandlers: Record<string, (args: any) => unknown> = {
      get_providers_in_area: () =>
        candidates.map((match) => ({
          id: match.provider.id,
          name: match.provider.name,
          gender: match.provider.gender,
          verified: match.provider.verified,
          languages: match.provider.languages,
          specializations: match.provider.specializations,
          distance_km: Number(match.distance_km.toFixed(1)),
          score: Number(match.score.total.toFixed(3)),
          rating: match.provider.rating,
          on_time_score: match.provider.on_time_score,
          cancellation_rate: match.provider.cancellation_rate,
        })),
      check_calendar_conflicts: () =>
        candidates.map((match) => ({
          id: match.provider.id,
          conflict: false,
          travel_time_minutes: match.travel_time_minutes,
          suggested_arrival_buffer_minutes: match.suggested_arrival_buffer_minutes,
        })),
      inspect_rejected_providers: () =>
        filteredOut.map((item) => ({
          id: item.provider.id,
          failed_filter: item.failed_filter,
          reason: item.reason,
        })),
      compare_baseline: () => ({
        baseline_provider_id: baselineProviderId,
        baseline_rule: 'first eligible provider by distance',
      }),
    };

    const tools = [
      {
        type: 'function',
        name: 'get_providers_in_area',
        description: 'Return eligible providers and observed quality signals for this care request.',
        parameters: { type: 'object', properties: { area: { type: 'string' } }, required: ['area'] },
      },
      {
        type: 'function',
        name: 'check_calendar_conflicts',
        description: 'Check whether candidate providers have calendar conflicts or travel timing risks.',
        parameters: { type: 'object', properties: { scheduled_time: { type: 'string' } } },
      },
      {
        type: 'function',
        name: 'inspect_rejected_providers',
        description: 'Show providers excluded by safety, gender, language, availability, or verification checks.',
        parameters: { type: 'object', properties: {} },
      },
      {
        type: 'function',
        name: 'compare_baseline',
        description: 'Show the non-agentic baseline provider selected by distance only.',
        parameters: { type: 'object', properties: {} },
      },
    ];

    let input: any[] = [
      {
        role: 'system',
        content:
          'You are a care-routing agent. Observe tool results, reason about strict preferences, risk, reliability, distance, and price, then choose ranked provider IDs. Return JSON only.',
      },
      {
        role: 'user',
        content: `Request: ${JSON.stringify(request)}
Return {"selected_provider_ids":["..."],"reasoning":"...","adapted_from_baseline":true|false}.`,
      },
    ];

    for (let i = 0; i < 4; i += 1) {
      const response = await this.client.responses.create({
        model: this.modelName,
        input,
        tools,
        tool_choice: i === 0 ? 'auto' : 'auto',
      } as any);
      const calls = (response.output ?? []).filter(
        (item: any) => item.type === 'function_call'
      ) as any[];
      if (calls.length === 0) {
        const parsed = JSON.parse(getResponseText(response));
        return {
          selected_provider_ids: parsed.selected_provider_ids ?? [],
          reasoning: parsed.reasoning ?? 'The agent selected providers after reviewing tool observations.',
          adapted_from_baseline: parsed.adapted_from_baseline,
          tool_trace: toolTrace,
        };
      }

      input = [...input, ...response.output];
      for (const call of calls) {
        const args = call.arguments ? JSON.parse(call.arguments) : {};
        const observation = toolHandlers[call.name]?.(args) ?? { error: `Unknown tool ${call.name}` };
        toolTrace.push({ tool: call.name, input: args, observation });
        input.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(observation),
        });
      }
    }

    return {
      selected_provider_ids: candidates.slice(0, 3).map((match) => match.provider.id),
      reasoning: 'The agent tool loop reached its step limit, so the safest ranked eligible candidates were returned.',
      adapted_from_baseline: false,
      tool_trace: toolTrace,
    };
  }

  async reviewQuoteWithTools(
    request: ParsedRequest,
    provider: Provider,
    quote: PricingBreakdown
  ): Promise<PricingBreakdown['pricing_agent']> {
    const trace: Array<{ tool: string; input: Record<string, unknown>; observation: unknown }> = [];
    const toolHandlers: Record<string, (args: any) => unknown> = {
      inspect_quote_lines: () => quote.line_items,
      check_urgency_flexibility: () => ({
        urgency: request.urgency,
        cheaper_slot_suggestion: quote.cheaper_slot_suggestion,
      }),
      check_provider_quality_risk: () => ({
        cancellation_rate: provider.cancellation_rate,
        on_time_score: provider.on_time_score,
        past_disputes: provider.past_disputes,
      }),
    };
    const tools = [
      {
        type: 'function',
        name: 'inspect_quote_lines',
        description: 'Inspect transparent quote line items and totals.',
        parameters: { type: 'object', properties: {} },
      },
      {
        type: 'function',
        name: 'check_urgency_flexibility',
        description: 'Check whether urgency fees can be avoided with a cheaper slot.',
        parameters: { type: 'object', properties: {} },
      },
      {
        type: 'function',
        name: 'check_provider_quality_risk',
        description: 'Check provider quality and dispute risk before final pricing.',
        parameters: { type: 'object', properties: {} },
      },
    ];
    let input: any[] = [
      {
        role: 'system',
        content:
          'You are a pricing fairness agent. Call tools before deciding. Return JSON only.',
      },
      {
        role: 'user',
        content: `Request: ${JSON.stringify(request)}
Provider: ${JSON.stringify({ id: provider.id, name: provider.name })}
Quote total: ${quote.total} ${quote.currency}
Return {"decision":"keep_quote|discount|suggest_cheaper_slot|escalate","reasoning":"..."}.`,
      },
    ];
    let parsed: {
      decision: NonNullable<PricingBreakdown['pricing_agent']>['decision'];
      reasoning: string;
    } = {
      decision: quote.cheaper_slot_suggestion ? 'suggest_cheaper_slot' : 'keep_quote',
      reasoning: 'The pricing agent reviewed the quote and provider risk observations.',
    };
    for (let i = 0; i < 4; i += 1) {
      const response = await this.client.responses.create({
        model: this.modelName,
        input,
        tools,
        tool_choice: 'auto',
      } as any);
      const calls = (response.output ?? []).filter(
        (item: any) => item.type === 'function_call'
      ) as any[];
      if (calls.length === 0) {
        parsed = JSON.parse(getResponseText(response));
        break;
      }
      input = [...input, ...response.output];
      for (const call of calls) {
        const args = call.arguments ? JSON.parse(call.arguments) : {};
        const observation = toolHandlers[call.name]?.(args) ?? { error: `Unknown tool ${call.name}` };
        trace.push({ tool: call.name, input: args, observation });
        input.push({
          type: 'function_call_output',
          call_id: call.call_id,
          output: JSON.stringify(observation),
        });
      }
    }
    return {
      tool_trace: trace,
      decision: parsed.decision,
      reasoning: parsed.reasoning,
    };
  }

  async summarizeDispute(dispute: Dispute): Promise<string> {
    const response = await this.client.responses.create({
      model: this.modelName,
      input: [
        {
          role: 'system',
          content: 'Summarize elder-care disputes empathetically and factually in plain language.',
        },
        {
          role: 'user',
          content: `Summarize this elder-care service dispute in 2 sentences for the family member.
Dispute: ${JSON.stringify(dispute)}
Do not use jargon.`,
        },
      ],
      max_output_tokens: 140,
    } as any);

    return getResponseText(response).trim();
  }
}
