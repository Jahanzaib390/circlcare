import { Provider } from '@/types/provider';
import { ParsedRequest } from '@/types/request';

export interface MatchScore {
  total: number; // 0–1 weighted aggregate
  specialization: number;
  availabilityFit: number;
  reliability: number;
  language: number;
  genderComfort: number;
  ratingRecency: number;
  cancellationRisk: number;
  distance: number;
  priceFit: number;
}

export interface HardFilterResult {
  passed: boolean;
  failedFilter?: string; // which filter rejected this provider
  reason?: string; // human-readable reason
}

export interface MatchResult {
  provider: Provider;
  score: MatchScore;
  hardFilterResult: HardFilterResult;
  explanation?: string; // Gemini-generated 2–3 sentence explanation
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
  is_offline_fallback?: boolean;
  fallback_message?: string;
}
