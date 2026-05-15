import type { ParsedRequest } from '../types/parsedRequest';
import type { Provider } from '../types/provider';
import type { Dispute } from '../types/dispute';

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
   * Summarise a dispute in plain language for display to the end user.
   */
  summarizeDispute(dispute: Dispute): Promise<string>;
}
