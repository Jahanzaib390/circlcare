import type { ParsedRequest } from '../types/parsedRequest';
import type { Provider } from '../types/provider';
import type { Dispute } from '../types/dispute';
import type { MatchResult, MatchResponse } from '../types/match';
import type { PricingBreakdown } from '../types/pricing';

export interface AgentToolTraceItem {
  tool: string;
  input: Record<string, unknown>;
  observation: unknown;
}

export interface MatchAgentDecision {
  selected_provider_ids: string[];
  reasoning: string;
  adapted_from_baseline?: boolean;
  tool_trace: AgentToolTraceItem[];
}

/**
 * LLMProvider - abstraction over any LLM backend (OpenAI, mock, etc.).
 * All methods return Promises so they are uniformly async.
 */
export interface LLMProvider {
  /**
   * Parse a raw natural-language care request into a structured ParsedRequest.
   * If confidence < 0.7, the returned object will have clarification_needed: true.
   */
  parseRequest(input: string): Promise<ParsedRequest>;

  /**
   * Generate a 2-3 sentence human-readable explanation of why a specific
   * provider was selected for a given request.
   */
  explainMatch(request: ParsedRequest, provider: Provider, score: number): Promise<string>;

  /**
   * Use a tool-calling loop to choose provider IDs from observed candidate data.
   * The backend supplies tools/observations; the LLM decides which tools to call
   * and returns the final ranked IDs plus reasoning.
   */
  selectMatchesWithTools(
    request: ParsedRequest,
    candidates: MatchResult[],
    filteredOut: MatchResponse['filtered_out'],
    baselineProviderId?: string
  ): Promise<MatchAgentDecision>;

  /**
   * Use tool observations to evaluate whether the transparent quote should stand,
   * receive a discount, or offer a cheaper slot.
   */
  reviewQuoteWithTools(
    request: ParsedRequest,
    provider: Provider,
    quote: PricingBreakdown
  ): Promise<PricingBreakdown['pricing_agent']>;

  /**
   * Summarise a dispute in plain language for display to the end user.
   */
  summarizeDispute(dispute: Dispute): Promise<string>;
}
