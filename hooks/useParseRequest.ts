import { useMutation } from '@tanstack/react-query';
import { usePathname, useRouter } from 'expo-router';
import { apiClient } from '@/services/apiClient';
import { useRequestStore } from '@/hooks/useRequestStore';
import type { ParsedRequest } from '@/types/request';

interface ParseResponse {
  // The API returns ParsedRequest directly as `data`
  service_bundle: ParsedRequest['service_bundle'];
  patient: string;
  location_from: string;
  location_to?: string;
  time_preference: string;
  scheduled_datetime?: string;
  mobility_needs: string[];
  provider_preferences: ParsedRequest['provider_preferences'];
  urgency: ParsedRequest['urgency'];
  risk_level: ParsedRequest['risk_level'];
  recurring?: ParsedRequest['recurring'];
  clarification_needed: boolean;
  clarification_question?: string;
  confidence: number;
}

interface ParseVariables {
  text: string;
  isEmergency?: boolean;
}

/**
 * Mutation hook for POST /api/parse-request.
 *
 * Usage:
 *   const { mutate: parseRequest, isPending } = useParseRequest();
 *   parseRequest({ text: 'I need a nurse for my mother' });
 */
export function useParseRequest() {
  const router = useRouter();
  const pathname = usePathname();
  const { isEmergency, setParsedRequest, addRecentRequest } = useRequestStore();

  const mutation = useMutation<ParseResponse, Error, ParseVariables>({
    mutationFn: ({ text, isEmergency: emergencyOverride }) =>
      apiClient.post<ParseResponse>('/api/parse-request', {
        text,
        isEmergency: emergencyOverride ?? isEmergency,
      }),

    onSuccess: (data, variables) => {
      console.info('[AgentDemo][Parse] Request text:', variables.text);
      console.info('[AgentDemo][Parse] Parsed care plan:', {
        service_bundle: data.service_bundle,
        patient: data.patient,
        location_from: data.location_from,
        time_preference: data.time_preference,
        urgency: data.urgency,
        clarification_needed: data.clarification_needed,
        confidence: data.confidence,
      });

      // Store parsed result in global state
      setParsedRequest(data as ParsedRequest);

      // Save to recent requests history
      addRecentRequest({
        id: Date.now().toString(),
        text: variables.text,
        timestamp: new Date().toISOString(),
        serviceBundle: data.service_bundle,
      });

      // Navigate to understanding screen
      if (pathname === '/request/understand') {
        router.replace('/request/understand');
      } else {
        router.push('/request/understand');
      }
    },

    onError: (err) => {
      console.error('[useParseRequest] Error:', err.message);
      // Error is surfaced via mutation.isError in the calling component
    },
  });

  return mutation;
}
