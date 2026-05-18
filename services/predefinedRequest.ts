import {
  HIGH_RISK_SERVICES,
  ServiceCategory,
  ServiceDisplayNames,
} from '@/constants/ServiceCategories';
import type { ParsedRequest } from '@/types/request';

export function buildPredefinedServiceRequest(
  category: ServiceCategory,
  isEmergency: boolean
): ParsedRequest {
  const requiresVerification = HIGH_RISK_SERVICES.includes(category);
  const label = ServiceDisplayNames[category].toLowerCase();
  const riskLevel: ParsedRequest['risk_level'] = isEmergency
    ? 'high'
    : requiresVerification
      ? 'medium'
      : 'low';

  return {
    input_source: 'quick_select',
    service_bundle: [category],
    patient: 'Family member',
    location_from: 'not specified',
    time_preference: 'flexible',
    mobility_needs: [],
    provider_preferences: {
      verified_only: requiresVerification,
    },
    urgency: isEmergency ? 'emergency' : 'medium',
    risk_level: riskLevel,
    clarification_needed: true,
    clarification_question: `Where and when do you need the ${label} service?`,
    confidence: 0.9,
  };
}
