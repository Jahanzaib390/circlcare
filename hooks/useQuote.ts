import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useQuoteStore } from '@/hooks/useQuoteStore';
import type { PricingBreakdown } from '@/types/pricing';
import type { Provider } from '@/types/provider';
import type { ParsedRequest } from '@/types/request';

interface QuoteVariables {
  provider: Provider;
  parsedRequest: ParsedRequest;
}

export function useQuote() {
  const { setPricing } = useQuoteStore();

  return useMutation<PricingBreakdown, Error, QuoteVariables>({
    mutationFn: ({ provider, parsedRequest }) =>
      apiClient.post<PricingBreakdown>('/api/quote', { provider, parsedRequest }),
    onSuccess: (data) => {
      console.info('[AgentDemo][Quote] Pricing decision:', data.pricing_agent?.decision);
      console.info('[AgentDemo][Quote] Reasoning:', data.pricing_agent?.reasoning);
      data.pricing_agent?.tool_trace.forEach((step, index) => {
        console.info(`[AgentDemo][Quote] Tool ${index + 1}: ${step.tool}`, step.observation);
      });
      setPricing(data);
    },
    onError: (err) => {
      console.error('[useQuote] Error:', err.message);
    },
  });
}
