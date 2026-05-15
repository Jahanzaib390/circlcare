import type { Provider } from './provider';
import type { ParsedRequest } from './parsedRequest';

export interface MatchScore {
  total: number;           // 0–1 weighted aggregate
  specialization: number;  // 0–1
  availabilityFit: number; // 0–1
  reliability: number;     // 0–1
  language: number;        // 0–1
  genderComfort: number;   // 0–1
  ratingRecency: number;   // 0–1
  cancellationRisk: number; // 0–1 (higher = better — already inverted)
  distance: number;        // 0–1 (higher = closer)
  priceFit: number;        // 0–1
}

export interface HardFilterResult {
  passed: boolean;
  failedFilter?: string; // which filter rejected this provider
  reason?: string;       // human-readable rejection reason
}

export interface TravelInfo {
  distance_km: number;
  travel_time_minutes: number;
  elder_buffer_minutes: number;
  suggested_arrival_buffer_minutes: number;
}

export interface MatchResult {
  provider: Provider;
  score: MatchScore;
  hardFilterResult: HardFilterResult;
  explanation?: string; // OpenAI-generated 2–3 sentence explanation
  distance_km: number;
  travel_time_minutes: number;
  elder_buffer_minutes: number;
  suggested_arrival_buffer_minutes: number;
  rank: number; // 1 = top match
}

export interface MatchResponse {
  request: ParsedRequest;
  top_matches: MatchResult[];
  filtered_out: Array<{
    provider: Provider;
    reason: string;
    failed_filter?: string;
    suggested_next_slot?: string;
  }>;
}

