# CirclCare AI — Project Structure Documentation

> Complete recommended folder/file organization, naming conventions, and module categorization.

---

## Root Structure

```
circlcare/
├── app/                        ← Expo Router screens (file-based navigation)
├── backend/                    ← Node.js/Express API server
├── assets/                     ← Static images, fonts, icons
├── components/                 ← Reusable React Native components
├── constants/                  ← Design tokens, config values, enums
├── data/                       ← Mock JSON data files
├── hooks/                      ← Custom React hooks
├── i18n/                       ← Localization strings
├── services/                   ← Frontend API service layer
├── stores/                     ← Zustand global state stores
├── types/                      ← Shared TypeScript interfaces
├── utils/                      ← Pure utility functions (frontend)
├── .env.local                  ← Local env vars (not committed)
├── .env.example                ← Template with all required keys
├── ACTION_PLAN.md
├── ARCHITECTURE.md
├── PROJECT_STRUCTURE.md
├── README.md
├── app.json
├── babel.config.js
├── tsconfig.json
└── package.json
```

---

## `app/` — Expo Router Screens

```
app/
├── _layout.tsx                 ← Root layout: fonts, splash, ThemeProvider, SafeAreaProvider
│
├── (tabs)/
│   ├── _layout.tsx             ← Bottom tab navigator (Home, Bookings, Providers, Profile)
│   ├── index.tsx               ← Home / Request Screen
│   ├── bookings.tsx            ← My Bookings list
│   ├── providers.tsx           ← Browse providers
│   └── profile.tsx             ← User profile + settings
│
├── request/
│   ├── understand.tsx          ← Understanding / Confirmation Screen
│   ├── match.tsx               ← Match Results Screen
│   ├── quote.tsx               ← Transparent Quote Screen
│   ├── confirm.tsx             ← Booking Confirmation
│   ├── status.tsx              ← Live Status + Timeline
│   └── feedback.tsx            ← Feedback + Rating Screen
│
└── modals/
    ├── dispute.tsx             ← Dispute Screen
    ├── provider-detail.tsx     ← Provider Profile Modal
    ├── location-picker.tsx     ← Location Selection Modal
    └── settings.tsx            ← App Settings Modal
```

**Naming conventions:**
- All screen files use `kebab-case.tsx`
- Layout files are always named `_layout.tsx`
- Modal group folder: `modals/`
- Stack group folder: `request/` (one-word, singular)

---

## `backend/` — Node.js API Server

```
backend/
├── src/
│   ├── server.ts               ← Express app bootstrap, middleware, route registration
│   │
│   ├── routes/
│   │   ├── parseRoutes.ts      ← POST /api/parse-request
│   │   ├── matchRoutes.ts      ← POST /api/match
│   │   ├── quoteRoutes.ts      ← POST /api/quote
│   │   ├── bookingRoutes.ts    ← POST/GET /api/bookings, /api/bookings/:id/*
│   │   ├── disputeRoutes.ts    ← POST /api/disputes
│   │   ├── providerRoutes.ts   ← GET /api/providers, POST /api/providers/:id/reputation
│   │   └── demoRoutes.ts       ← POST /api/demo/scenario/:id
│   │
│   ├── services/
│   │   ├── matchingEngine.ts   ← Hard filters + weighted scoring
│   │   ├── pricingEngine.ts    ← Itemized quote calculation
│   │   ├── bookingSimulator.ts ← Booking lifecycle state machine
│   │   ├── disputeEngine.ts    ← Dispute classification + recommendation
│   │   └── reputationEngine.ts ← Provider score updates after feedback
│   │
│   ├── llm/
│   │   ├── LLMProvider.ts      ← Interface (parseRequest, explainMatch, summarizeDispute, etc.)
│   │   ├── OpenAIProvider.ts   ← Google OpenAI API implementation
│   │   └── MockLLMProvider.ts  ← Offline/test stub returning typed fixtures
│   │
│   ├── middleware/
│   │   ├── errorHandler.ts     ← Global Express error handler
│   │   ├── requestLogger.ts    ← Log method, path, duration
│   │   └── validate.ts         ← Request body validation (zod)
│   │
│   ├── utils/
│   │   ├── haversine.ts        ← Distance between two GeoPoints
│   │   ├── travelTime.ts       ← ETA estimation (distance * multiplier + buffer)
│   │   ├── responseHelpers.ts  ← success(), error() response factories
│   │   └── cache.ts            ← In-memory LLM response cache (hash → response)
│   │
│   └── types/                  ← Shared with frontend via symlink or copy-on-build
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
├── nodemon.json
├── package.json
└── tsconfig.json
```

**Naming conventions:**
- Service files: `camelCase` + `Engine` / `Simulator` / `Provider` suffix
- Route files: `camelCase` + `Routes.ts`
- All exports are named (no default exports in services)

---

## `components/` — Reusable Components

```
components/
│
├── ui/                         ← Primitive / design-system components
│   ├── Button.tsx              ← Primary, secondary, danger variants
│   ├── Card.tsx                ← Elevated card container
│   ├── Badge.tsx               ← Status, confidence, trust badges
│   ├── Avatar.tsx              ← Provider photo with fallback initials
│   ├── Chip.tsx                ← Selectable filter/tag chip
│   ├── Divider.tsx             ← Horizontal rule
│   ├── SkeletonLoader.tsx      ← Loading placeholder skeleton
│   ├── EmptyState.tsx          ← Empty list/error state with CTA
│   ├── StarRating.tsx          ← Interactive star rating input
│   └── ProgressStep.tsx        ← Single step in a vertical timeline
│
├── home/                       ← Home screen components
│   ├── RequestInput.tsx        ← Multi-line text input + char counter
│   ├── VoiceInputButton.tsx    ← Animated mic with state machine
│   ├── CategoryGrid.tsx        ← 8-tile quick-category shortcuts
│   ├── RecentRequests.tsx      ← Recent request history list
│   └── PriorityToggle.tsx      ← Emergency / high-priority toggle
│
├── match/                      ← Match results components
│   ├── ProviderCard.tsx        ← Provider summary card (recommended/alternative)
│   ├── TrustBadges.tsx         ← Verified, gender, language, on-time badges
│   ├── MatchExplanation.tsx    ← OpenAI explanation expandable section
│   └── RejectionReasons.tsx    ← Why others were filtered out
│
├── booking/                    ← Booking flow components
│   ├── QuoteLineItem.tsx       ← Single pricing line (label + amount)
│   ├── BookingTimeline.tsx     ← Vertical step timeline
│   ├── StatusBanner.tsx        ← Live status prominent banner
│   └── LiveMapPlaceholder.tsx  ← Static map with mock provider dot
│
├── feedback/                   ← Feedback & dispute components
│   ├── ServiceChecklist.tsx    ← Per-service completion checklist
│   ├── ComplaintSelector.tsx   ← Multi-select complaint reason chips
│   ├── DisputeTypePicker.tsx   ← Dispute type selection
│   └── ResolutionCard.tsx      ← Refund/revisit/escalate recommendation
│
└── shared/                     ← Used across multiple feature areas
    ├── ProviderDetailModal.tsx ← Full provider profile modal
    ├── LocationPickerModal.tsx ← Area/GPS location selection
    ├── ConfidenceBadge.tsx     ← Color-coded parse confidence indicator
    ├── LanguageTags.tsx        ← Language chip list
    ├── PriceDisplay.tsx        ← Formatted PKR price
    └── SectionHeader.tsx       ← Screen section heading
```

**Naming conventions:**
- All component files: `PascalCase.tsx`
- One component per file
- Props interface named `ComponentNameProps`, defined at top of file
- No inline styles — use `StyleSheet.create()` at bottom of file

---

## `constants/` — Design Tokens & Config

```
constants/
├── Theme.ts                    ← Colors, spacing, typography, shadows, border radii
├── ServiceCategories.ts        ← ServiceCategory enum + display names + icons
├── BookingStatuses.ts          ← BookingStatus enum + labels + colors
├── Languages.ts                ← Language enum used throughout app
├── MatchingWeights.ts          ← Default and per-category scoring weights
└── Config.ts                   ← API base URL, timeouts, polling intervals, thresholds
```

**Theme.ts structure:**
```typescript
export const Colors = {
  primary: '#4F46E5',          // Indigo — brand
  primaryDark: '#3730A3',
  accent: '#10B981',           // Emerald — confirmed/success
  warning: '#F59E0B',          // Amber — pending/caution
  danger: '#EF4444',           // Red — cancelled/dispute
  neutral: { 50: '...', ... },
  surface: { light: '#FFFFFF', dark: '#1E1E2E' },
  text: { primary: '...', secondary: '...', muted: '...' },
};

export const Spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const Radius = { sm: 6, md: 12, lg: 16, xl: 24, full: 999 };
export const FontSize = { xs: 11, sm: 13, base: 15, lg: 17, xl: 20, xxl: 24, display: 30 };
export const FontFamily = { regular: 'Inter_400Regular', medium: 'Inter_500Medium', bold: 'Nunito_700Bold' };
```

---

## `data/` — Mock JSON Data

```
data/
├── providers.json              ← 15–20 providers with full schema
├── services.json               ← All service categories with pricing factors
├── bookings.json               ← 3–5 bookings in various lifecycle states
├── users.json                  ← 2–3 user profiles with saved locations
└── demo-scenarios.json         ← 5 scripted demo scenarios (A–E)
```

**Provider entry structure (abbreviated):**
```json
{
  "id": "care_001",
  "name": "Sana Care Services",
  "gender": "female",
  "services": ["caregiver", "elder_companion", "medicine_pickup"],
  "languages": ["Urdu", "Punjabi", "English"],
  "areas": ["DHA", "Model Town", "Gulberg"],
  "verified": true,
  "wheelchair_support": false,
  "rating": 4.8,
  "on_time_score": 0.94,
  "cancellation_rate": 0.03,
  "location": { "lat": 31.5204, "lng": 74.3587, "area": "Gulberg" },
  "service_radius_km": 12
}
```

---

## `hooks/` — Custom React Hooks

```
hooks/
├── useTheme.ts                 ← Access design tokens + color scheme
├── useVoiceInput.ts            ← Voice state machine (idle/listening/ready/error)
├── useLocation.ts              ← GPS permission + manual area selection
├── useBookingPolling.ts        ← Poll /api/bookings/:id/status every N seconds
├── useRecentRequests.ts        ← Read/write recent requests from AsyncStorage
└── useOnboarding.ts            ← Check onboarding completion flag
```

**Naming convention:** All hooks prefixed with `use`, camelCase filename.

---

## `i18n/` — Localization

```
i18n/
├── en.json                     ← English UI strings
├── ur.json                     ← Urdu UI strings
└── index.ts                    ← useTranslation hook (expo-localization)
```

**Key convention:** `screen_name.component.string_key`
```json
{
  "home.request_input.placeholder": "What do you need handled?",
  "home.category.clinic_visit": "Clinic Visit",
  "match.why_selected.title": "Why selected",
  "booking.status.en_route": "Provider is en route"
}
```

---

## `services/` — Frontend API Service Layer

```
services/
├── api.ts                      ← Base fetch/axios client, base URL, error handling
├── requestService.ts           ← parseRequest(input), generateClarification(parsed)
├── matchService.ts             ← getMatchResults(request), explainMatch(...)
├── quoteService.ts             ← getQuote(matchData)
├── bookingService.ts           ← createBooking(), cancelBooking(), getStatus(), simulateNext()
├── disputeService.ts           ← submitDispute(dispute)
└── providerService.ts          ← getProviders(filters), getProviderDetail(id)
```

**Naming convention:** `verbNoun()` for all exported functions.

---

## `stores/` — Zustand State Stores

```
stores/
├── useRequestStore.ts          ← Raw input, parsedRequest, confidence, clarification state
├── useBookingStore.ts          ← Current booking, history, selected provider, match results, quote
├── useUserStore.ts             ← User profile, saved locations, preferences
└── useDemoStore.ts             ← Demo mode flag, active scenario
```

**Naming convention:** `use` prefix + `PascalCase` + `Store` suffix.  
**Pattern:** Each store defines its state interface above the `create()` call.

---

## `types/` — TypeScript Interfaces (Shared)

```
types/
├── provider.ts                 ← Provider, AvailabilitySlot, GeoPoint
├── service.ts                  ← ServiceCategory, ServiceDefinition, PricingFactor
├── booking.ts                  ← Booking, BookingStatus, BookingTimelineEvent
├── request.ts                  ← ParsedRequest, ProviderPreferences, RecurringSchedule
├── match.ts                    ← MatchResult, MatchScore, HardFilterResult
├── pricing.ts                  ← PricingBreakdown, QuoteLineItem
├── dispute.ts                  ← Dispute, DisputeType, DisputeRecommendation
└── user.ts                     ← UserProfile, Location, UserPreferences
```

**Naming convention:** Interfaces use `PascalCase`; type aliases use `PascalCase`; enums use `PascalCase`.  
**Rule:** No `I` prefix on interfaces (e.g., use `Provider`, not `IProvider`).

---

## `utils/` — Frontend Utility Functions

```
utils/
├── formatPrice.ts              ← formatPKR(amount): string → "Rs. 3,550"
├── formatDate.ts               ← formatBookingTime(iso): string → "Tomorrow, 11:00 AM"
├── formatDistance.ts           ← formatKm(km): string → "6.8 km away"
├── confidence.ts               ← getConfidenceColor(score), getConfidenceLabel(score)
└── serviceHelpers.ts           ← getServiceIcon(category), getServiceDisplayName(category)
```

---

## `assets/` — Static Assets

```
assets/
├── images/
│   ├── icon.png                ← App icon (1024×1024)
│   ├── splash.png              ← Splash screen
│   ├── adaptive-icon.png       ← Android adaptive icon
│   └── favicon.png             ← Web favicon
├── fonts/                      ← Loaded via expo-font (if not using Google Fonts CDN)
└── illustrations/              ← SVG/PNG illustrations for empty states, onboarding
```

---

## Naming Conventions Summary

| Item | Convention | Example |
|------|-----------|---------|
| Screen files | `kebab-case.tsx` | `provider-detail.tsx` |
| Component files | `PascalCase.tsx` | `ProviderCard.tsx` |
| Hook files | `camelCase.ts` with `use` prefix | `useVoiceInput.ts` |
| Store files | `camelCase.ts` with `use` prefix | `useBookingStore.ts` |
| Service files | `camelCase.ts` with feature name | `bookingService.ts` |
| Utility files | `camelCase.ts` with noun | `formatPrice.ts` |
| Type files | `camelCase.ts` with domain noun | `provider.ts` |
| Constant files | `PascalCase.ts` | `Theme.ts`, `ServiceCategories.ts` |
| JSON data files | `kebab-case.json` | `demo-scenarios.json` |
| Backend route files | `camelCase.ts` + `Routes` | `bookingRoutes.ts` |
| Backend service files | `camelCase.ts` + `Engine`/`Simulator` | `matchingEngine.ts` |

---

## Component Categorization

| Category | Folder | Purpose |
|----------|--------|---------|
| Primitives | `components/ui/` | Design system atoms — no business logic |
| Feature components | `components/home/`, `match/`, `booking/`, `feedback/` | Feature-scoped, one use context |
| Shared feature | `components/shared/` | Used across 2+ feature areas |
| Screen-level | `app/**/` | Expo Router screens — composition only |

**Rule:** Primitives in `ui/` must never import from stores or services. Feature components may import from stores/services. Screens orchestrate both.

---

## `.agents/skills/` — Agent Skills

```
.agents/
└── skills/
    └── circlcare-dev/
        └── SKILL.md            ← Agent skill for CirclCare development context
```


