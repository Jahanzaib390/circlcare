/**
 * useMatchResults.ts — React Query mutation for POST /api/match.
 *
 * Called imperatively from MatchResultsScreen on mount (via mutate in useEffect).
 * Stores result in useMatchStore for access across screens.
 */

import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useMatchStore } from '@/hooks/useMatchStore';
import type { MatchResponse } from '@/types/match';
import type { ParsedRequest } from '@/types/request';

interface MatchVariables {
  parsedRequest: ParsedRequest;
}

export function useMatchResults() {
  const { setMatchResponse } = useMatchStore();

  return useMutation<MatchResponse, Error, MatchVariables>({
    mutationFn: ({ parsedRequest }) =>
      apiClient.post<MatchResponse>('/api/match', { parsedRequest }),

    onSuccess: (data) => {
      console.info('[AgentDemo][Match] Agent decision:', data.agent_decision?.reasoning);
      data.agent_trace?.forEach((step, index) => {
        console.info(`[AgentDemo][Match] Tool ${index + 1}: ${step.tool}`, step.observation);
      });
      console.info('[AgentDemo][Match] Baseline comparison:', data.baseline_comparison);
      setMatchResponse(data);
    },

    onError: (err) => {
      console.error('[useMatchResults] Error:', err.message);
    },
  });
}
