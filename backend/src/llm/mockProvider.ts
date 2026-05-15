import type { LLMProvider } from './llmProvider';
import type { ParsedRequest, ServiceCategory } from '../types/parsedRequest';
import type { Provider } from '../types/provider';
import type { Dispute } from '../types/dispute';

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
    const genderRequired = lower.includes('female') ? 'female_required'
      : lower.includes('male') ? 'male_required'
      : 'any';

    // ── Location extraction ────────────────────────────────────────────────────
    const locationKeywords = ['gulshan', 'dha', 'clifton', 'nazimabad', 'north nazimabad',
      'johar', 'f-7', 'f-8', 'g-9', 'blue area', 'bahria', 'model town',
      'johar town', 'gulberg', 'lahore', 'karachi', 'islamabad', 'rawalpindi'];
    const foundLocation = locationKeywords.find(k => lower.includes(k));
    const locationFrom = foundLocation
      ? foundLocation.charAt(0).toUpperCase() + foundLocation.slice(1)
      : 'not specified';

    // ── Time extraction ─────────────────────────────────────────────────────
    const timeMap: [string, string][] = [
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
    const timePreference = foundTime ? foundTime[1] : 'flexible';

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
    if (lower.includes('stretcher') || lower.includes('bed-ridden')) mobilityNeeds.push('stretcher');
    if (lower.includes('oxygen')) mobilityNeeds.push('oxygen support');

    // ── Confidence ────────────────────────────────────────────────────────────
    const needsClarification = locationFrom === 'not specified' || services[0] === 'daily_support';
    const confidence = needsClarification ? 0.55 : 0.88;

    return {
      service_bundle: services,
      patient,
      location_from: locationFrom,
      time_preference: timePreference,
      mobility_needs: mobilityNeeds,
      provider_preferences: {
        gender: genderRequired as ParsedRequest['provider_preferences']['gender'],
        verified_only: ['home_nurse', 'physiotherapy', 'lab_sample'].some(s =>
          services.includes(s as ServiceCategory)
        ),
        elder_care_experience: true,
      },
      urgency,
      risk_level: isEmergency ? 'high' : services.includes('home_nurse') ? 'medium' : 'low',
      clarification_needed: needsClarification,
      clarification_question: needsClarification
        ? locationFrom === 'not specified'
          ? 'Could you share the location where care is needed?'
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

  async summarizeDispute(dispute: Dispute): Promise<string> {
    const typeMap: Record<Dispute['type'], string> = {
      no_show: 'The provider did not show up for the scheduled visit.',
      late_arrival: 'The provider arrived significantly later than the scheduled time.',
      extra_charge: 'An unexpected additional charge was applied beyond the agreed quote.',
      incomplete: 'The service was not completed as described in the booking.',
      safety_concern: 'A safety concern was raised during the provider visit.',
    };
    return (
      `${typeMap[dispute.type]} ` +
      `This has been logged and our team will review booking #${dispute.booking_id} promptly.`
    );
  }
}
