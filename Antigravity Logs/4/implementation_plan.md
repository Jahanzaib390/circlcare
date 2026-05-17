# Phase 2 — Provider Matching Engine

Implement the complete provider matching pipeline: backend scoring engine, distance utilities, Gemini explanation generation, and a polished `MatchResultsScreen` on the frontend.

**Dependencies satisfied:** Phase 0 ✅ + Phase 1 ✅ (mock data, LLM interface, request store, understand screen all exist)

---

## Proposed Changes

### 2.1 Matching Engine Core — Backend

#### [NEW] `backend/src/services/matchingEngine.ts`
Core matching logic in two stages:

**Stage 1 — Hard Filters** (boolean reject, reason recorded):
| Filter | Rule |
|--------|------|
| Service type | Provider must offer ≥1 requested service |
| Area coverage | Provider's `areas` must intersect `location_from` OR distance ≤ `service_radius_km` |
| Home visit | If request implies home care, `home_visit` must be true |
| Gender | `female_required` / `male_required` → hard reject if mismatch. UNIT TESTED. |
| Language | If `language` prefs marked critical, hard reject if no overlap |
| Verified | If `verified_only: true`, unverified providers hard-rejected |
| Wheelchair | If `mobility_needs` contains `wheelchair`, `wheelchair_support` must be true |

**Stage 2 — Weighted Scoring** (returns 0–1 aggregate):
| Factor | Weight |
|--------|--------|
| Specialization match | 20% |
| Availability fit | 15% |
| Reliability / on-time score | 15% |
| Language match | 10% |
| Gender / comfort fit | 10% |
| Rating + review recency | 10% |
| Cancellation risk (inverted) | 10% |
| Distance / travel time | 5% |
| Price fit | 5% |

Weights adjustable per service category (e.g. `home_nurse` → gender/verified weighted higher).

Returns: `top_matches: MatchResult[]` (top 3) + `filtered_out: {provider, reason}[]`.

---

#### [NEW] `backend/src/services/matchingEngine.ts` — weight config map
Service-category-specific weight overrides:
- `home_nurse`: gender 15%, verified 15%, specialization 20%
- `physiotherapy`: specialization 25%, availability 15%
- `caregiver`: gender 15%, language 15%
- `clinic_visit`: availability 20%, distance 10%

---

#### [MODIFY] `backend/src/routes/matchRoutes.ts`
Wire `POST /api/match` → call `matchingEngine.match(parsedRequest)` → call `llm.explainMatch()` for each top match → return `MatchResponse`.

Request body: `{ parsedRequest: ParsedRequest }` (frontend sends the confirmed parsed request from the understand screen).

---

### 2.2 Distance & Travel Time Utilities

#### [NEW] `backend/src/utils/haversine.ts`
```typescript
haversineKm(a: GeoPoint, b: GeoPoint): number
estimateTravelTime(km: number): {
  distance_km: number;
  travel_time_minutes: number;
  elder_buffer_minutes: number;       // always +15
  suggested_arrival_buffer_minutes: number; // travel + elder_buffer
}
```
Formula: `travel_time = km * 3.5 + traffic_buffer(5)`. Elder buffer always 15 min.

---

### 2.3 Gemini Match Explanation + Caching

`explainMatch` already exists in both `GeminiProvider` and `MockProvider`. No changes needed to the interface.

#### [NEW] `backend/src/utils/explanationCache.ts`
Simple in-memory `Map<string, string>` cache. Key = `sha256(JSON(request) + providerId)` (or a lighter hash using `crypto.createHash`). Cache hit → skip API call.

#### [MODIFY] `backend/src/routes/matchRoutes.ts`
After scoring, call `llm.explainMatch()` for top-3 results, checking cache first, storing results.

Also generate plain-text rejection reasons for filtered providers (done in `matchingEngine.ts` already from `failedFilter` field — map to user-readable string here).

---

### 2.4 Match Results Screen — Frontend

#### [MODIFY] `app/request/match.tsx`
Full `MatchResultsScreen` rebuild:

**Layout:**
- Top recommended card — full-width hero card with gradient header, provider photo placeholder (Avatar), name, rating stars, trust badges
- 2 alternative cards — compact side-by-side or stacked
- Collapsible "Why others weren't recommended" section at bottom

**Trust badges** (horizontal pill row):
- ✓ Verified (green shield)
- Gender icon (pink/blue)
- Languages (globe icon + comma list)
- On-time % (clock icon)
- ★ Rating (yellow star)

**"Why selected" panel:**
- Expandable accordion — shows Gemini explanation string
- Animated height transition

**Animations:**
- Cards slide up with staggered `Animated.spring` on mount
- Expandable panel uses `LayoutAnimation` or Animated height

**Navigation:**
- "Book this Provider" CTA → `/request/quote`
- Back arrow → `/request/understand`

**State:** `useMatchResults` hook (new) — calls `POST /api/match` with `parsedRequest` from store.

---

#### [NEW] `hooks/useMatchResults.ts`
React Query `useQuery` (not mutation — auto-fires on mount). Calls `POST /api/match` with `parsedRequest`. Stores result in Zustand `useMatchStore`.

#### [NEW] `hooks/useMatchStore.ts`
Zustand store for match results — `matchResponse: MatchResponse | null`, `selectedProvider: Provider | null`, setters.

---

### Supporting Backend Types

#### [MODIFY] `backend/src/types/provider.ts`
Expand to full Provider schema (matching `data/providers.json`): add `home_visit`, `wheelchair_support`, `verified`, `on_time_score`, `cancellation_rate`, `base_rate`, `hourly_rate`, `location: GeoPoint`, `service_radius_km`, `availability: AvailabilitySlot[]`, `capacity_per_day`, `experience_years`, `past_disputes`, `risk_flags`.

#### [NEW] `backend/src/types/match.ts`
Mirror of `types/match.ts` — `MatchScore`, `HardFilterResult`, `MatchResult`, `MatchResponse`.

---

## Verification Plan

### Automated
- Start backend: `cd backend && npm run dev`
- Test `POST /api/match` with a Lahore/DHA + `home_nurse` + `female_required` request
  - Verify: male providers are NOT in top_matches and ARE in filtered_out
  - Verify: top_matches are ordered by score descending
  - Verify: each top_match has `explanation` string
- Test `POST /api/match` with `wheelchair: true` in mobility_needs
  - Verify: providers with `wheelchair_support: false` are filtered out

### Frontend
- Navigate Home → type request → confirm → tap "Looks Right"
- MatchResultsScreen shows top 3 cards with badges and Gemini explanations
- Expandable "Why selected" accordion works
- "Why others weren't recommended" section is collapsible

### Edge Cases
- `verified_only: true` + no verified provider in area → `filtered_out` has all providers, UI shows "No verified providers found" empty state
- `female_required` + no female provider → filtered_out all, UI empty state with suggestion

---

## Open Questions

> [!NOTE]
> **Location matching**: The providers have `areas: string[]` and `location: GeoPoint`. The parsed request has `location_from: string` (text, e.g. "DHA" or "Gulberg"). The matching engine will do **case-insensitive substring match** on `areas` as the primary filter, with haversine as a secondary check when area is ambiguous. This is sufficient for demo purposes.

> [!NOTE]
> **Day-of-week for availability**: The parsed request has `time_preference` (text like "tomorrow morning"). The engine will extract day-of-week from a scheduled datetime (if present) or default to checking if the provider has any available slot — not doing strict day-of-week filtering for demo to avoid over-filtering the small provider pool.
