/**
 * explanationCache.ts — In-memory cache for Gemini match explanations.
 * Avoids redundant API calls for the same (request + provider) pair.
 *
 * Key: SHA-256 hash of (serialized request subset + providerId)
 * Value: Explanation string
 */

import { createHash } from 'crypto';
import type { ParsedRequest } from '../types/parsedRequest';

const cache = new Map<string, string>();

/**
 * Generate a stable cache key from the request and provider ID.
 * Only hashes the fields that affect the explanation output.
 */
function buildCacheKey(request: ParsedRequest, providerId: string): string {
  const relevantRequest = {
    service_bundle: request.service_bundle,
    urgency: request.urgency,
    provider_preferences: request.provider_preferences,
    location_from: request.location_from,
  };

  const payload = JSON.stringify(relevantRequest) + '::' + providerId;
  return createHash('sha256').update(payload).digest('hex').slice(0, 16);
}

/**
 * Retrieve a cached explanation if one exists.
 */
export function getCachedExplanation(request: ParsedRequest, providerId: string): string | undefined {
  const key = buildCacheKey(request, providerId);
  return cache.get(key);
}

/**
 * Store an explanation in the cache.
 */
export function setCachedExplanation(
  request: ParsedRequest,
  providerId: string,
  explanation: string
): void {
  const key = buildCacheKey(request, providerId);
  cache.set(key, explanation);
}

/**
 * Clear the entire explanation cache (useful for testing).
 */
export function clearExplanationCache(): void {
  cache.clear();
}

/**
 * Return current cache size (for monitoring/logging).
 */
export function getExplanationCacheSize(): number {
  return cache.size;
}
