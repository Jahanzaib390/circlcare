# CirclCare AI — Technical Architecture Document

> **Project:** CirclCare AI  
> **Stack:** Expo 54 / React Native 0.81 / TypeScript, Node.js/Express backend, OpenAI API  
> **Pattern:** Client ↔ REST API ↔ Business Logic Engines ↔ LLM Provider Abstraction ↔ Mock Data Store

---

## 1. System Overview

CirclCare AI is a two-tier mobile application:

```
┌─────────────────────────────────────────┐
│           Mobile App (Expo / RN)         │
│   Expo Router · React · Zustand          │
└──────────────────┬──────────────────────┘
                   │ REST (JSON)
┌──────────────────▼──────────────────────┐
│         Backend API (Node.js/Express)    │
│                                          │
│  ┌─────────────────────────────────┐    │
│  │      LLM Provider Layer          │    │
│  │  OpenAIProvider implements       │    │
│  │  LLMProvider interface           │    │
│  └────────────────┬────────────────┘    │
│                   │                      │
│  ┌────────────────▼────────────────┐    │
│  │   Business Logic Engines         │    │
│  │  Matching · Pricing · Booking    │    │
│  │  Dispute · Reputation · Fallback │    │
│  └────────────────┬────────────────┘    │
│                   │                      │
│  ┌────────────────▼────────────────┐    │
│  │       Data Layer                 │    │
│  │  JSON files (prototype)          │    │
│  │  → Firestore / PostgreSQL (prod) │    │
│  └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
                   │
┌──────────────────▼──────────────────────┐
│         OpenAI API                │
│  OpenAI API (prototype) → production OpenAI project (prod)│
└─────────────────────────────────────────┘
```

---

## 2. Frontend Architecture

### 2.1 Technology Choices

| Concern | Technology | Rationale |
|---------|-----------|-----------|
| Framework | Expo 54 / React Native 0.81 | Cross-platform; fast iteration |
| Language | TypeScript 5.9 (strict) | Type safety across schemas |
| Navigation | Expo Router (file-based) | Deep-linking; nested layouts |
| State Management | Zustand | Lightweight; no boilerplate |
| Async State | TanStack Query (React Query) | Caching; loading/error states |
| Styling | React Native StyleSheet + Theme tokens | No external CSS-in-JS needed |
| Fonts | Expo Font (Nunito + Inter) | Urdu-friendly + modern UI |
| Animations | React Native Reanimated 4 | Smooth, 60fps animations |
| Gestures | React Native Gesture Handler | Swipes, presses |
| Icons | @expo/vector-icons (Ionicons) | Consistent icon set |
| Local Storage | AsyncStorage | Onboarding flags; recent requests |
| Voice Input | @react-native-voice/voice | Speech-to-text on device |

### 2.2 Navigation Architecture

```
app/
├── _layout.tsx              ← Root layout (fonts, splash, safe area)
├── (tabs)/
│   ├── _layout.tsx          ← Bottom tab navigator
│   ├── index.tsx            ← Home / Request Screen
│   ├── bookings.tsx         ← Bookings list
│   ├── providers.tsx        ← Browse providers
│   └── profile.tsx          ← User profile + settings
│
├── request/
│   ├── understand.tsx       ← Understanding / Confirmation Screen
│   ├── match.tsx            ← Match Results Screen
│   ├── quote.tsx            ← Quote Screen
│   ├── confirm.tsx          ← Booking Confirmation
│   ├── status.tsx           ← Live Status Screen
│   └── feedback.tsx         ← Feedback & Rating Screen
│
└── modals/
    ├── dispute.tsx          ← Dispute Screen (modal)
    ├── provider-detail.tsx  ← Provider Profile Modal
    ├── location-picker.tsx  ← Location Selection Modal
    └── settings.tsx         ← Settings Modal
```

**Navigation Flow:**

```
Home ──[submit request]──► Understand ──[confirm]──► Match ──[select provider]──► Quote
                                                                                     │
                           ◄──[back]──────────────────────────────────── [book now]──┘
                                                                                     │
                           Bookings ◄── Confirm ◄──────────────────────────────────┘
                               │
                               └──► Status ──[service complete]──► Feedback
                                                                       │
                                                                 [dispute] ──► Dispute Modal
```

### 2.3 State Management Architecture

#### Global State (Zustand Stores)

```typescript
// stores/useRequestStore.ts
interface RequestStore {
  rawInput: string;
  parsedRequest: ParsedRequest | null;
  confidence: number;
  clarificationNeeded: boolean;
  setRawInput(input: string): void;
  setParsedRequest(request: ParsedRequest): void;
  reset(): void;
}

// stores/useBookingStore.ts
interface BookingStore {
  currentBooking: Booking | null;
  bookingHistory: Booking[];
  selectedProvider: Provider | null;
  matchResults: MatchResult[];
  quote: PricingBreakdown | null;
  setMatchResults(results: MatchResult[]): void;
  setSelectedProvider(provider: Provider): void;
  setQuote(quote: PricingBreakdown): void;
  confirmBooking(booking: Booking): void;
}

// stores/useUserStore.ts
interface UserStore {
  user: UserProfile | null;
  savedLocations: Location[];
  preferences: UserPreferences;
  setUser(user: UserProfile): void;
  addSavedLocation(location: Location): void;
}

// stores/useDemoStore.ts
interface DemoStore {
  isDemoMode: boolean;
  activeScenario: string | null;
  toggleDemoMode(): void;
  loadScenario(scenarioId: string): void;
}
```

#### Server State (React Query)

```typescript
// Cached server state — auto invalidation + retry
useProviders(filters)       // GET /api/providers
useMatchResults(request)    // POST /api/match
useQuote(matchData)         // POST /api/quote
useBookingStatus(bookingId) // GET /api/bookings/:id/status (polling)
useBookingHistory(userId)   // GET /api/bookings?userId=
```

### 2.4 API Service Layer (Frontend)

```
services/
├── api.ts               ← Axios/fetch base client with interceptors
├── requestService.ts    ← parseRequest(), generateClarification()
├── matchService.ts      ← getMatchResults(), explainMatch()
├── quoteService.ts      ← getQuote()
├── bookingService.ts    ← createBooking(), cancelBooking(), getStatus()
├── disputeService.ts    ← submitDispute()
└── providerService.ts   ← getProviders(), getProviderDetail()
```

All services follow:
```typescript
async function serviceCall<T>(payload): Promise<ApiResponse<T>> {
  // handles loading, error, retry, and clear live-agent failure states
}
```

---

## 3. Backend Architecture

### 3.1 Technology Choices

| Concern | Technology |
|---------|-----------|
| Runtime | Node.js 20 LTS |
| Framework | Express 4 + TypeScript |
| Process Manager | nodemon (dev) / pm2 (prod) |
| Environment | dotenv |
| Testing | Jest + Supertest |
| Judge delivery | Expo preview link/APK connected to a prepared backend with live OpenAI credentials; `/api/agent/status` verifies readiness |

### 3.2 Module Boundaries

```
backend/
├── src/
│   ├── server.ts              ← Express app entry point
│   ├── routes/
│   │   ├── parseRoutes.ts     ← POST /api/parse-request
│   │   ├── matchRoutes.ts     ← POST /api/match
│   │   ├── quoteRoutes.ts     ← POST /api/quote
│   │   ├── bookingRoutes.ts   ← POST/GET /api/bookings
│   │   ├── disputeRoutes.ts   ← POST /api/disputes
│   │   ├── providerRoutes.ts  ← GET /api/providers, POST /api/providers/:id/reputation
│   │   └── demoRoutes.ts      ← POST /api/demo/scenario/:id
│   │
│   ├── services/
│   │   ├── matchingEngine.ts  ← Stage 1 filters + Stage 2 weighted scoring
│   │   ├── pricingEngine.ts   ← Transparent quote generation
│   │   ├── bookingSimulator.ts← Booking lifecycle simulation
│   │   ├── disputeEngine.ts   ← Dispute classification + recommendation
│   │   └── reputationEngine.ts← Rating + score updates
│   │
│   ├── llm/
│   │   ├── LLMProvider.ts     ← Interface definition
│   │   ├── OpenAIProvider.ts  ← OpenAI API implementation
│   │   └── MockLLMProvider.ts ← Test/local-development stub
│   │
│   ├── utils/
│   │   ├── haversine.ts       ← Distance calculation
│   │   ├── travelTime.ts      ← ETA estimation
│   │   ├── responseHelpers.ts ← Standard API response shapes
│   │   └── cache.ts           ← Simple in-memory LLM response cache
│   │
│   ├── data/                  ← JSON mock data store
│   │   ├── providers.json
│   │   ├── services.json
│   │   ├── bookings.json
│   │   ├── users.json
│   │   └── demo-scenarios.json
│   │
│   └── types/
│       ├── provider.ts
│       ├── service.ts
│       ├── booking.ts
│       ├── request.ts
│       ├── match.ts
│       ├── pricing.ts
│       └── dispute.ts
│
├── tests/
│   ├── matchingEngine.test.ts
│   ├── pricingEngine.test.ts
│   ├── disputeEngine.test.ts
│   └── haversine.test.ts
│
├── .env.example
├── package.json
└── tsconfig.json
```

### 3.3 LLM Provider Abstraction

```typescript
// llm/LLMProvider.ts
interface LLMProvider {
  parseRequest(input: string): Promise<ParsedRequest>;
  generateClarification(parsed: ParsedRequest): Promise<string>;
  explainMatch(request: ParsedRequest, provider: Provider, score: MatchScore): Promise<string>;
  summarizeDispute(dispute: Dispute): Promise<string>;
  generateNotification(event: BookingEvent): Promise<string>;
}

// llm/OpenAIProvider.ts — current implementation
class OpenAIProvider implements LLMProvider { ... }

// llm/MockLLMProvider.ts — for tests and local development
class MockLLMProvider implements LLMProvider { ... }
```

**Swap path to production:** Change `OPENAI_MODEL` or the `OpenAIProvider` implementation without changing route or matching code.

### 3.4 Matching Engine Design

```
MatchingEngine.match(request: ParsedRequest, providers: Provider[]): MatchResult[]

Stage 1 — Hard Filters (deterministic, no LLM):
  applyServiceTypeFilter()
  applyAreaFilter()
  applyAvailabilityFilter()
  applyHomeVisitFilter()
  applyGenderFilter()          ← HARD REJECT if user explicitly requires
  applyLanguageFilter()        ← HARD REJECT if marked critical
  applyVerificationFilter()    ← HARD REJECT for high-risk services
  applyWheelchairFilter()

Stage 2 — Weighted Scoring (deterministic):
  scoreSpecialization()        ← 20%
  scoreAvailabilityFit()       ← 15%
  scoreReliability()           ← 15%
  scoreLanguage()              ← 10%
  scoreGenderComfort()         ← 10%
  scoreRatingRecency()         ← 10%
  scoreCancellationRisk()      ← 10%
  scoreDistance()              ← 5%
  scorePriceFit()              ← 5%

  getWeights(serviceCategory)  ← per-category weight overrides

Stage 3 — Explanation (LLM):
  llmProvider.explainMatch(request, topProvider, score)
  generateRejectionReasons(filteredProviders)
```

### 3.5 API Contract

All endpoints return:
```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": { "requestId": "uuid", "timestamp": "ISO8601" }
}
```

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/parse-request` | POST | Parse natural language input via OpenAI |
| `/api/match` | POST | Run matching engine against parsed request |
| `/api/quote` | POST | Generate itemized pricing quote |
| `/api/bookings` | POST | Create booking |
| `/api/bookings/:id` | GET | Get booking details |
| `/api/bookings/:id/status` | GET | Get current status (polling) |
| `/api/bookings/:id/simulate` | POST | Advance booking status (demo) |
| `/api/bookings/:id/cancel` | POST | Cancel + trigger fallback |
| `/api/disputes` | POST | Submit dispute |
| `/api/providers` | GET | List/filter providers |
| `/api/providers/:id` | GET | Provider detail |
| `/api/providers/:id/reputation` | POST | Update reputation post-feedback |
| `/api/demo/scenario/:id` | POST | Load demo scenario (A–E) |

---

## 4. Data Architecture

### 4.1 Core Type Definitions

```typescript
// Provider
interface Provider {
  id: string;
  name: string;
  provider_type: 'individual' | 'agency';
  gender: 'male' | 'female' | 'other';
  services: ServiceCategory[];
  specializations: string[];
  languages: Language[];
  areas: string[];
  home_visit: boolean;
  verified: boolean;
  family_friendly: boolean;
  wheelchair_support: boolean;
  rating: number;            // 0–5
  review_count: number;
  recent_review_score: number;
  on_time_score: number;     // 0–1
  cancellation_rate: number; // 0–1
  base_rate: number;         // PKR
  hourly_rate: number;       // PKR
  experience_years: number;
  capacity_per_day: number;
  availability: AvailabilitySlot[];
  location: GeoPoint;
  service_radius_km: number;
  risk_flags: string[];
  past_disputes: number;
}

// ParsedRequest (from OpenAI)
interface ParsedRequest {
  service_bundle: ServiceCategory[];
  patient: string;
  location_from: string;
  location_to?: string;
  time_preference: string;
  scheduled_datetime?: string;
  mobility_needs: string[];
  provider_preferences: {
    gender?: 'female_required' | 'male_required' | 'female_preferred' | 'any';
    language?: Language[];
    verified_only: boolean;
    elder_care_experience?: boolean;
  };
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  risk_level: 'low' | 'medium' | 'high';
  recurring?: RecurringSchedule;
  clarification_needed: boolean;
  clarification_question?: string;
  confidence: number; // 0–1
}

// Booking
interface Booking {
  booking_id: string;
  user_id: string;
  provider_id: string;
  service_bundle: ServiceCategory[];
  scheduled_start: string;    // ISO 8601
  status: BookingStatus;
  quoted_price: number;
  pricing_breakdown: PricingBreakdown[];
  risk_level: 'low' | 'medium' | 'high';
  family_notified: boolean;
  recurring?: RecurringSchedule;
  timeline: BookingTimelineEvent[];
  cancellation_reason?: string;
  compensation_discount?: number;
}

type BookingStatus =
  | 'pending' | 'confirmed' | 'provider_assigned'
  | 'family_notified' | 'en_route' | 'arrived'
  | 'in_progress' | 'completed' | 'proof_uploaded'
  | 'feedback_collected' | 'cancelled' | 'disputed';
```

### 4.2 Location Strategy

**Prototype (Hackathon):**
- Providers have mock `lat/lng` coordinates in JSON
- Users select area, type neighborhood name, or use the location picker map
- The location picker uses Google Maps through `react-native-maps` to show a selected-area pin and seeded provider pins
- Current-location requests ask for phone permission before matching proceeds
- OpenAI extracts area name from natural language
- Backend applies Haversine distance using mock coordinates

**Production Path:**
- Google Places API for address autocomplete
- Google Routes API / Distance Matrix API for real ETAs
- Provider app shares live location
- Matching engine distance calculation unchanged (just fed real coords)

---

## 5. Authentication & Security Architecture

### 5.1 Prototype Auth (Simplified)
- User profiles stored in local state (Zustand) + AsyncStorage
- No actual auth for hackathon; user selects profile on launch
- API endpoints are open (no auth middleware)

### 5.2 Production Auth Path
```
Firebase Authentication
  ├── Phone number OTP (primary — no email needed for informal users)
  ├── Google Sign-In (optional)
  └── Anonymous session → upgrade on booking

JWT tokens in Authorization header
  └── Backend verifies via Firebase Admin SDK

Row-level security in Firestore rules
Provider auth separate scope (provider app)
```

---

## 6. Multilingual & Localization Architecture

```
i18n/
├── en.json       ← English strings
├── ur.json       ← Urdu strings
└── index.ts      ← i18n hook (expo-localization)
```

- **Input language:** Mixed (Roman Urdu, Urdu, English, code-switched) — handled by OpenAI, no client-side NLP
- **UI language:** English for hackathon; Urdu strings added as `ur.json` keys
- **RTL support:** `I18nManager.forceRTL(true)` for Urdu UI if needed
- **Font:** `Nunito` supports Latin + Urdu-adjacent rendering; consider `Noto Nastaliq Urdu` for Urdu script display

---

## 7. Scalability & Production Architecture

### Prototype Stack
```
Expo (managed workflow or dev client)
Node.js + Express locally for development; prepared backend with live OpenAI credentials for judge-facing Expo/APK builds
OpenAI API
JSON files as data store
In-memory booking state
```

### Production Stack
```
React Native (bare workflow for custom native modules)
Cloud Run (auto-scaling backend containers)
OpenAI production API (production tier, audit trails)
Firestore (real-time document DB for bookings, providers)
  OR PostgreSQL (structured relational data)
Cloud Tasks (scheduled reminders, T-60 min notifications)
Pub/Sub (booking event bus: confirmed → assigned → en_route → completed)
Firebase Cloud Messaging (push notifications to family, user, provider)
Firebase Auth (phone OTP)
Google Maps SDK + Places API + Routes API
Cloud Monitoring + Logging + Error Reporting
```

### Scaling Considerations
- **Matching Engine** is CPU-bound; runs in memory — scales horizontally on Cloud Run
- **LLM calls** are the latency bottleneck; mitigate with caching and parallel clarification calls
- **Booking state machine** should use Pub/Sub events in production to decouple services
- **Provider availability** requires real-time coordination; use Firestore listeners in production

---

## 8. Safety & Fairness Architecture

- Gender and language preferences are implemented as HARD FILTERS (deterministic, not LLM-guided)
- Caste, sect, ethnic, and religion-based matching is explicitly prohibited in engine config
- Provider rejection reasons are auditable (logged per request)
- OpenAI explanations are framed in terms of comfort, safety, language, and care-context — not identity
- All matching weight configurations are code-reviewed, not AI-generated

---

## 9. Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | Zustand | Minimal boilerplate; easy to test |
| Server state | React Query | Automatic caching + retry + loading states |
| Navigation | Expo Router | File-based; deep linking out of box |
| LLM abstraction | Interface + DI | Swap OpenAI API → production OpenAI project without rewriting |
| Matching logic | Deterministic (not LLM) | Auditable, testable, safe, explainable |
| Pricing logic | Deterministic formulas | Transparent, auditable, no hallucination risk |
| Real-time updates | Polling (5s) | Sufficient for demo; avoids WebSocket complexity |
| Data store | JSON files → Firestore | Fast to build; clear migration path |
| Distance | Haversine → Routes API | Works now; production upgrade is isolated to one util |





