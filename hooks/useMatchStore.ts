/**
 * useMatchStore.ts — Zustand store for match results.
 * Holds the full MatchResponse from POST /api/match and tracks selected provider.
 */

import { create } from 'zustand';
import type { MatchResponse, MatchResult } from '@/types/match';

interface MatchState {
  matchResponse: MatchResponse | null;
  selectedMatch: MatchResult | null;

  setMatchResponse: (response: MatchResponse | null) => void;
  setSelectedMatch: (match: MatchResult | null) => void;
  clearMatch: () => void;
}

export const useMatchStore = create<MatchState>()((set) => ({
  matchResponse: null,
  selectedMatch: null,

  setMatchResponse: (response) =>
    set({ matchResponse: response, selectedMatch: response?.top_matches[0] ?? null }),

  setSelectedMatch: (match) => set({ selectedMatch: match }),

  clearMatch: () => set({ matchResponse: null, selectedMatch: null }),
}));
