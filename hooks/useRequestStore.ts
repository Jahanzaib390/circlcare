import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ParsedRequest } from '@/types/request';
import Config from '@/constants/Config';

export interface RecentRequest {
  id: string;
  text: string;
  timestamp: string; // ISO 8601
  serviceBundle: string[];
}

interface RequestState {
  // Current request in progress
  rawRequest: string;
  parsedRequest: ParsedRequest | null;
  isEmergency: boolean;

  // History
  recentRequests: RecentRequest[];

  // Actions
  setRawRequest: (text: string) => void;
  setParsedRequest: (parsed: ParsedRequest | null) => void;
  setIsEmergency: (value: boolean) => void;
  addRecentRequest: (item: RecentRequest) => void;
  clearCurrent: () => void;
  clearHistory: () => void;
}

export const useRequestStore = create<RequestState>()(
  persist(
    (set, get) => ({
      rawRequest: '',
      parsedRequest: null,
      isEmergency: false,
      recentRequests: [],

      setRawRequest: (text) => set({ rawRequest: text }),

      setParsedRequest: (parsed) => set({ parsedRequest: parsed }),

      setIsEmergency: (value) => set({ isEmergency: value }),

      addRecentRequest: (item) => {
        const current = get().recentRequests;
        // Deduplicate by text and cap at limit
        const filtered = current.filter((r) => r.text !== item.text);
        set({
          recentRequests: [item, ...filtered].slice(0, Config.recentRequestsLimit),
        });
      },

      clearCurrent: () =>
        set({ rawRequest: '', parsedRequest: null, isEmergency: false }),

      clearHistory: () => set({ recentRequests: [] }),
    }),
    {
      name: 'circlcare-request-store',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist history — transient state is not persisted
      partialize: (state) => ({ recentRequests: state.recentRequests }),
    }
  )
);
