# CirclCare AI — Developer Agent Skill

## Purpose

This skill gives an AI coding agent full context about the CirclCare AI project so it can assist with implementation without needing to re-read all documentation from scratch.

---

## What Is CirclCare AI?

CirclCare AI is a **multilingual, agent-assisted mobile platform** for coordinating informal elder-care services. It is built for families in Pakistan who currently manage elder-care needs through WhatsApp, phone calls, and manual follow-up.

The app turns noisy natural-language requests (Roman Urdu, Urdu, English, code-switched) into structured service plans, matches the right local provider using explainable rules, generates transparent quotes, schedules the job, simulates live progress, captures proof of completion, updates reputation, and handles disputes.

**It is NOT** a generic service marketplace or a single-domain app. It is a trust-aware coordination layer.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Mobile App | Expo 54 / React Native 0.81 / TypeScript |
| Navigation | Expo Router (file-based) |
| State | Zustand (global) + React Query (server) |
| Backend | Node.js + Express + TypeScript |
| LLM | Google Gemini API (AI Studio → Vertex AI) |
| Data (prototype) | JSON files |
| Data (production) | Firestore or PostgreSQL |
| Auth (production) | Firebase Auth (phone OTP) |

---

## Repository Layout

```
circlcare/
├── app/                ← Expo Router screens
│   ├── (tabs)/         ← Bottom tabs: Home, Bookings, Providers, Profile
│   ├── request/        ← Stack: understand → match → quote → confirm → status → feedback
│   └── modals/         ← Dispute, ProviderDetail, LocationPicker, Settings
├── backend/            ← Express API server
│   └── src/
│       ├── routes/     ← REST endpoints
│       ├── services/   ← matchingEngine, pricingEngine, bookingSimulator, disputeEngine
│       ├── llm/        ← LLMProvider interface + GeminiProvider + MockLLMProvider
│       └── utils/      ← haversine, travelTime, cache, responseHelpers
├── components/         ← Reusable RN components (ui/, home/, match/, booking/, feedback/, shared/)
├── constants/          ← Theme, ServiceCategories, Config, MatchingWeights
├── data/               ← Mock JSON: providers, services, bookings, users, demo-scenarios
├── hooks/              ← useVoiceInput, useLocation, useBookingPolling, useTheme, etc.
├── i18n/               ← en.json, ur.json
├── services/           ← Frontend API clients: requestService, matchService, bookingService, etc.
├── stores/             ← Zustand: useRequestStore, useBookingStore, useUserStore, useDemoStore
├── types/              ← Shared TS interfaces: Provider, ParsedRequest, Booking, MatchResult, etc.
└── utils/              ← formatPrice, formatDate, formatDistance, confidence, serviceHelpers
```

---

## Core Data Flow

```
User types/speaks request
  → VoiceInputButton (speech-to-text) or text input
  → POST /api/parse-request (Gemini extracts structured ParsedRequest JSON)
  → UnderstandingScreen (show extraction, ask clarification if confidence < 0.7)
  → POST /api/match (matchingEngine: hard filters + weighted scoring)
  → MatchResultsScreen (top 3 providers + Gemini explanations)
  → POST /api/quote (pricingEngine: itemized breakdown)
  → QuoteScreen → user confirms
  → POST /api/bookings (bookingSimulator: assign provider, notify family)
  → BookingConfirmationScreen → Track Status
  → GET /api/bookings/:id/status (polling every 5s) → LiveStatusScreen
  → POST /api/bookings/:id/simulate (advance status for demo)
  → FeedbackScreen (rating + checklist + complaint)
  → POST /api/providers/:id/reputation (update scores)
  → [optional] POST /api/disputes → DisputeEngine → Gemini summarize
```

---

## Key Interfaces (Types)

```typescript
// ParsedRequest — output of Gemini parse
interface ParsedRequest {
  service_bundle: ServiceCategory[];
  patient: string;
  location_from: string;
  time_preference: string;
  provider_preferences: {
    gender?: 'female_required' | 'male_required' | 'female_preferred' | 'any';
    language?: string[];
    verified_only: boolean;
  };
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  risk_level: 'low' | 'medium' | 'high';
  clarification_needed: boolean;
  clarification_question?: string;
  confidence: number; // 0–1
}

// Provider — mock data schema
interface Provider {
  id: string; name: string; gender: 'male' | 'female';
  services: string[]; specializations: string[];
  languages: string[]; areas: string[];
  home_visit: boolean; verified: boolean; wheelchair_support: boolean;
  rating: number; on_time_score: number; cancellation_rate: number;
  base_rate: number; hourly_rate: number;
  location: { lat: number; lng: number; area: string };
  service_radius_km: number; availability: AvailabilitySlot[];
}

// Booking status lifecycle
type BookingStatus =
  'pending' | 'confirmed' | 'provider_assigned' | 'family_notified' |
  'en_route' | 'arrived' | 'in_progress' | 'completed' |
  'proof_uploaded' | 'feedback_collected' | 'cancelled' | 'disputed';
```

---

## LLM Provider Interface

```typescript
interface LLMProvider {
  parseRequest(input: string): Promise<ParsedRequest>;
  generateClarification(parsed: ParsedRequest): Promise<string>;
  explainMatch(request: ParsedRequest, provider: Provider, score: MatchScore): Promise<string>;
  summarizeDispute(dispute: Dispute): Promise<string>;
  generateNotification(event: BookingEvent): Promise<string>;
}
// Current implementation: GeminiProvider (AI Studio)
// Test stub: MockLLMProvider
// Production migration: change GeminiProvider to use Vertex AI SDK — no other code changes
```

---

## Matching Engine Rules

**Stage 1 — Hard Filters (deterministic, blocks provider if fails):**
- Service type match
- Serves requested area
- Available (no slot conflict)
- Supports home visit (if required)
- Gender match — **HARD REJECT if explicitly required** (safety rule, not preference)
- Language match — hard if marked critical
- Verified — hard for high-risk services
- Wheelchair support — hard if requested

**Stage 2 — Weighted Scoring:**

| Factor | Weight |
|--------|--------|
| Specialization | 20% |
| Availability fit | 15% |
| Reliability/on-time | 15% |
| Language | 10% |
| Gender comfort | 10% |
| Rating recency | 10% |
| Cancellation risk | 10% |
| Distance | 5% |
| Price fit | 5% |

Weights are overridden per service category (e.g., nursing → gender/verification weighted higher).

---

## Pricing Formula

```
total =
  base_service_price
  + distance_fee (km bands)
  + waiting_time_fee (clinic/appointment services)
  + complexity_fee (intermediate/complex)
  + urgency_fee (same-day / emergency)
  + add_on_fees (wheelchair, medicine pickup, etc.)
  - loyalty_discount (recurring plan)
```

Returns `PricingBreakdown[]` — array of `{ label, amount }` line items.

---

## Demo Scenarios (A–E)

| Scenario | Request | Key Features |
|----------|---------|-------------|
| A — Clinic Visit Bundle | Ammi ko kal clinic le jana, wheelchair car + medicine pickup | Multi-service bundle, wheelchair hard filter, quote |
| B — Recurring Caregiver | Nani ke liye female caregiver, roz 2 ghantay, Punjabi, Model Town | Gender hard filter, recurring schedule, weekly price |
| C — Home Physiotherapy | Abu ki knee surgery ke baad physio, evening, Urdu speaking | Specialization match, slot preference, rejection explanation |
| D — Food + Medicine | Diabetic meal + weekly medicine refill | Service splitting, subscription plan |
| E — Cancellation Fallback | Provider cancels 40 min before | Re-ranking, compensation discount, family notification |

---

## 8 Robustness Cases to Demo

1. Ambiguous request → clarification question
2. Missing location → location modal
3. No female provider in area → graceful no-match screen
4. Provider cancellation → re-rank + compensation
5. Overlapping booking → next slot suggestion
6. Extra charge dispute → dispute flow + refund recommendation
7. Gemini confidence < 0.7 → manual category form fallback
8. API failure → offline banner + cached provider list

---

## Coding Conventions

- **TypeScript strict mode** — no `any`, proper return types on all functions
- **Named exports only** — no default exports in services, stores, or hooks
- **Component props**: `interface ComponentNameProps` at top of file
- **Styles**: `StyleSheet.create()` at bottom of component file — no inline objects
- **Hooks**: always prefixed `use`, pure functions with no side effects in body
- **Services**: all async functions return `Promise<ApiResponse<T>>`
- **Backend**: all routes call a service function — no business logic in route handlers
- **Tests**: matching engine hard filters must be unit tested exhaustively

---

## Environment Variables

```bash
# Frontend (.env.local)
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_GEMINI_KEY=your_key_here

# Backend (.env)
GEMINI_API_KEY=your_key_here
PORT=3000
NODE_ENV=development
```

---

## Quick Commands

```bash
# Frontend
npm start              # Start Expo dev server
npm run android        # Open on Android emulator
npm run ios            # Open on iOS simulator
npm run lint           # Run ESLint

# Backend (from /backend)
npm run dev            # nodemon with ts-node
npm test               # Jest test suite
npm run build          # Compile TypeScript

# Build (EAS)
eas build --profile preview --platform android   # Preview APK
eas build --profile development                  # Dev client build
```

---

## Safety Rules (Do Not Violate)

1. **Gender/preference hard filters** must be deterministic — never delegate to LLM
2. **No caste, sect, ethnic, or religion-based matching** — prohibited in engine config
3. **Gemini is not the decision-maker** for matching, pricing, or booking state
4. **API keys must never be committed** — use `.env.local` / `.env` only
5. **Provider rejection reasons must be auditable** (logged per request)
