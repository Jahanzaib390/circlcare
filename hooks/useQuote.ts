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
      setPricing(data);
    },
    onError: (err) => {
      console.error('[useQuote] Error:', err.message);
    },
  });
}
