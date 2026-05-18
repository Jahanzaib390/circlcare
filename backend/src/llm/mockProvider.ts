import type { LLMProvider } from './llmProvider';
import type { ParsedRequest, ServiceCategory } from '../types/parsedRequest';
import type { Provider } from '../types/provider';
import type { Dispute } from '../types/dispute';
import type { MatchResult, MatchResponse } from '../types/match';
import type { PricingBreakdown } from '../types/pricing';

/**
 * MockProvider — deterministic LLM implementation for demos and testing.
 * No API key required. Responses are based on simple keyword matching.
 */
export class MockProvider implements LLMProvider {
  async parseRequest(input: string): Promise<ParsedRequest> {
    const lower = input.toLowerCase();

    // ── Service detection ────────────────────────────────────────────────────
    const services: ServiceCategory[] = [];
    if (lower.includes('nurse') || lower.includes('nursing')) services.push('home_nurse');
    if (lower.includes('clinic') || lower.includes('doctor') || lower.includes('hospital'))
      services.push('clinic_visit');
    if (lower.includes('caregiver') || lower.includes('care giver') || lower.includes('helper'))
      services.push('caregiver');
    if (lower.includes('physio') || lower.includes('physical therapy') || lower.includes('rehab'))
      services.push('physiotherapy');
    if (lower.includes('medicine') || lower.includes('prescription') || lower.includes('pharmacy'))
      services.push('medicine_pickup');
    if (lower.includes('lab') || lower.includes('blood test') || lower.includes('sample'))
      services.push('lab_sample');
    if (lower.includes('meal') || lower.includes('food') || lower.includes('diet'))
      services.push('meal_plan');
    if (lower.includes('companion') || lower.includes('company')) services.push('elder_companion');
    if (services.length === 0) services.push('daily_support');

    // ── Emergency / urgency detection ─────────────────────────────────────────
    const isEmergency =
      lower.includes('emergency') || lower.includes('urgent') || lower.includes('immediately');
    const urgency: ParsedRequest['urgency'] = isEmergency ? 'emergency' : 'medium';

    // ── Gender preference detection ────────────────────────────────────────────
    const genderRequired = lower.includes('female')
      ? 'female_required'
      : lower.includes('male')
        ? 'male_required'
        : 'any';

    const languagePrefs: string[] = [];
    if (lower.includes('urdu')) languagePrefs.push('Urdu');
    if (lower.includes('english')) languagePrefs.push('English');
    if (lower.includes('punjabi')) languagePrefs.push('Punjabi');
    if (lower.includes('sindhi')) languagePrefs.push('Sindhi');
    if (lower.includes('pashto')) languagePrefs.push('Pashto');
    if (lower.includes('saraiki')) languagePrefs.push('Saraiki');
    const languageRequired =
      languagePrefs.length > 0 &&
      (lower.includes('must speak') ||
        lower.includes('required language') ||
        lower.includes('only speaks') ||
        lower.includes('cannot speak'));

    // ── Location extraction ────────────────────────────────────────────────────
    const currentLocationRequested =
      lower.includes('near me') ||
      lower.includes('nearby') ||
      lower.includes('current location') ||
      lower.includes('qareeb') ||
      lower.includes('qarib') ||
      lower.includes('mere qareeb') ||
      lower.includes('mere qarib');
    const cityMentioned =
      lower.includes('lahore') ||
      lower.includes('karachi') ||
      lower.includes('islamabad') ||
      lower.includes('rawalpindi');
    const ambiguousLocation = [
      ['bahria town', 'Bahria Town'],
      ['bahria', 'Bahria Town'],
      ['dha', 'DHA'],
      ['cantt', 'Cantt'],
      ['gulberg', 'Gulberg'],
      ['model town', 'Model Town'],
    ].find(([keyword]) => lower.includes(keyword) && !cityMentioned);
    const locationKeywords = [
      'dha karachi',
      'dha lahore',
      'gulshan-e-iqbal karachi',
      'clifton karachi',
      'f-7 islamabad',
      'f-8 islamabad',
      'g-9 islamabad',
      'bahria town lahore',
      'bahria town karachi',
      'bahria town rawalpindi',
      'model town lahore',
      'gulberg lahore',
      'gulshan-e-iqbal',
      'north nazimabad',
      'blue area',
      'clifton',
      'nazimabad',
      'johar town',
      'johar',
      'f-7',
      'f-8',
      'g-9',
      'lahore',
      'karachi',
      'islamabad',
      'rawalpindi',
    ];
    const foundLocation = locationKeywords.find((k) => lower.includes(k));
    const locationFrom = currentLocationRequested
      ? 'current_location_requested'
      : ambiguousLocation
      ? ambiguousLocation[1]
      : foundLocation
      ? foundLocation.charAt(0).toUpperCase() + foundLocation.slice(1)
      : 'not specified';
    const locationTo =
      currentLocationRequested &&
      (lower.includes('clinic') || lower.includes('doctor') || lower.includes('hospital'))
        ? 'nearby clinic'
        : undefined;

    // ── Time extraction ─────────────────────────────────────────────────────
    const timeMap: [string, string][] = [
      ['kal subah', 'tomorrow morning'],
      ['kal dopahar', 'tomorrow afternoon'],
      ['kal shaam', 'tomorrow evening'],
      ['kal', 'tomorrow'],
      ['tomorrow morning', 'tomorrow morning'],
      ['tomorrow afternoon', 'tomorrow afternoon'],
      ['tomorrow evening', 'tomorrow evening'],
      ['tomorrow', 'tomorrow'],
      ['today', 'today'],
      ['monday', 'Monday'],
      ['tuesday', 'Tuesday'],
      ['wednesday', 'Wednesday'],
      ['thursday', 'Thursday'],
      ['friday', 'Friday'],
      ['saturday', 'Saturday'],
      ['sunday', 'Sunday'],
      ['morning', 'morning'],
      ['afternoon', 'afternoon'],
      ['evening', 'evening'],
    ];
    const foundTime = timeMap.find(([k]) => lower.includes(k));
    const timePreference = foundTime ? foundTime[1] : 'not specified';

    // ── Patient extraction ────────────────────────────────────────────────────
    const patientMap: [string, string][] = [
      ['my mother', 'Patient (Mother)'],
      ['my father', 'Patient (Father)'],
      ['my grandmother', 'Patient (Grandmother)'],
      ['my grandfather', 'Patient (Grandfather)'],
      ['my wife', 'Patient (Wife)'],
      ['my husband', 'Patient (Husband)'],
      ['my parent', 'Patient (Parent)'],
    ];
    const foundPatient = patientMap.find(([k]) => lower.includes(k));
    const patient = foundPatient ? foundPatient[1] : 'Patient';

    // ── Mobility needs ────────────────────────────────────────────────────────
    const mobilityNeeds: string[] = [];
    if (lower.includes('wheelchair')) mobilityNeeds.push('wheelchair');
    if (lower.includes('stretcher') || lower.includes('bed-ridden'))
      mobilityNeeds.push('stretcher');
    if (lower.includes('oxygen')) mobilityNeeds.push('oxygen support');

    // ── Confidence ────────────────────────────────────────────────────────────
    const needsLocationClarification =
      currentLocationRequested || Boolean(ambiguousLocation) || locationFrom === 'not specified';
    const needsTimeClarification = timePreference === 'not specified';
    const needsClarification =
      needsLocationClarification || needsTimeClarification || services[0] === 'daily_support';
    const confidence = needsClarification ? 0.55 : 0.88;

    return {
      service_bundle: services,
      patient,
      location_from: locationFrom,
      location_to: locationTo,
      time_preference: timePreference,
      mobility_needs: mobilityNeeds,
      provider_preferences: {
        gender: genderRequired as ParsedRequest['provider_preferences']['gender'],
        language: languagePrefs.length > 0 ? languagePrefs : undefined,
        language_required: languageRequired,
        verified_only: ['home_nurse', 'physiotherapy', 'lab_sample'].some((s) =>
          services.includes(s as ServiceCategory)
        ),
        elder_care_experience: true,
      },
      urgency,
      risk_level: isEmergency ? 'high' : services.includes('home_nurse') ? 'medium' : 'low',
      clarification_needed: needsClarification,
      clarification_question: needsClarification
        ? currentLocationRequested
          ? 'Should I use your current location to find nearby clinic support?'
          : ambiguousLocation
            ? `Which city is ${ambiguousLocation[1]} in: Lahore, Karachi, or Islamabad/Rawalpindi?`
            : locationFrom === 'not specified'
              ? 'Could you share the location where care is needed?'
              : needsTimeClarification
                ? 'When should we arrange this visit?'
                : 'Could you clarify what type of care or support is needed?'
        : undefined,
      confidence,
    };
  }

  async explainMatch(request: ParsedRequest, provider: Provider, score: number): Promise<string> {
    const services = request.service_bundle.join(', ').replace(/_/g, ' ');
    const pct = (score * 100).toFixed(0);
    return (
      `${provider.name} is an excellent match for your ${services} request with a ${pct}% compatibility score. ` +
      `They are ${provider.verified ? 'verified' : 'experienced'}, rated ${provider.rating.toFixed(1)}/5, ` +
      `and maintain a ${(provider.on_time_score * 100).toFixed(0)}% on-time arrival rate — ensuring reliable elder care.`
    );
  }

  async selectMatchesWithTools(
    request: ParsedRequest,
    candidates: MatchResult[],
    filteredOut: MatchResponse['filtered_out'],
    baselineProviderId?: string
  ) {
    const trace = [
      {
        tool: 'get_providers_in_area',
        input: { area: request.location_from, services: request.service_bundle },
        observation: candidates.map((match) => ({
          id: match.provider.id,
          name: match.provider.name,
          gender: match.provider.gender,
          verified: match.provider.verified,
          distance_km: Number(match.distance_km.toFixed(1)),
          cancellation_rate: match.provider.cancellation_rate,
          score: Number(match.score.total.toFixed(3)),
        })),
      },
      {
        tool: 'inspect_rejected_providers',
        input: { count: filteredOut.length },
        observation: filteredOut.map((item) => ({
          id: item.provider.id,
          failed_filter: item.failed_filter,
          reason: item.reason,
        })),
      },
      {
        tool: 'check_calendar_conflicts',
        input: { scheduled_datetime: request.scheduled_datetime ?? request.time_preference },
        observation: candidates.map((match) => ({
          id: match.provider.id,
          conflict: false,
          suggested_arrival_buffer_minutes: match.suggested_arrival_buffer_minutes,
        })),
      },
    ];

    const highRisk = request.risk_level === 'high';
    const selected = [...candidates].sort((a, b) => {
      if (highRisk && a.provider.verified !== b.provider.verified) {
        return a.provider.verified ? -1 : 1;
      }
      if (a.provider.cancellation_rate !== b.provider.cancellation_rate) {
        return a.provider.cancellation_rate - b.provider.cancellation_rate;
      }
      return b.score.total - a.score.total;
    });

    const selectedIds = selected.slice(0, 3).map((match) => match.provider.id);
    const top = selected[0];
    return {
      selected_provider_ids: selectedIds,
      adapted_from_baseline: Boolean(top && baselineProviderId && top.provider.id !== baselineProviderId),
      reasoning: top
        ? `${top.provider.name} was selected after checking area coverage, schedule fit, verification, cancellation risk, and family preferences.`
        : 'No eligible provider remained after tool checks.',
      tool_trace: trace,
    };
  }

  async reviewQuoteWithTools(
    request: ParsedRequest,
    provider: Provider,
    quote: PricingBreakdown
  ): Promise<PricingBreakdown['pricing_agent']> {
    const trace = [
      {
        tool: 'inspect_quote_lines',
        input: { provider_id: provider.id },
        observation: quote.line_items,
      },
      {
        tool: 'check_urgency_flexibility',
        input: { urgency: request.urgency, time_preference: request.time_preference },
        observation: {
          cheaper_slot_available: Boolean(quote.cheaper_slot_suggestion),
          cheaper_slot_suggestion: quote.cheaper_slot_suggestion,
        },
      },
      {
        tool: 'check_provider_quality_risk',
        input: { provider_id: provider.id },
        observation: {
          cancellation_rate: provider.cancellation_rate,
          on_time_score: provider.on_time_score,
          past_disputes: provider.past_disputes,
        },
      },
    ];

    const decision = quote.cheaper_slot_suggestion ? 'suggest_cheaper_slot' : 'keep_quote';
    return {
      tool_trace: trace,
      decision,
      reasoning:
        decision === 'suggest_cheaper_slot'
          ? 'The pricing agent kept the transparent quote but surfaced a cheaper slot because urgency fees are avoidable if the family can wait.'
          : 'The pricing agent checked line items and provider risk signals, then kept the quote unchanged.',
    };
  }

  async summarizeDispute(dispute: Dispute): Promise<string> {
    const typeMap: Record<Dispute['type'], string> = {
      no_show: 'The provider did not show up for the scheduled visit.',
      late_arrival: 'The provider arrived significantly later than the scheduled time.',
      extra_charge: 'An unexpected additional charge was applied beyond the agreed quote.',
      incomplete_service: 'The service was not completed as described in the booking.',
      safety_concern: 'A safety concern was raised during the provider visit.',
    };
    return (
      `${typeMap[dispute.type]} ` +
      `This has been logged and our team will review booking #${dispute.booking_id} promptly.`
    );
  }
}
