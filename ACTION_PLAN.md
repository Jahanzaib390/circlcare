# CirclCare AI — Granular Phase-wise Action Plan

> **Project:** CirclCare AI — Multilingual Elder-Care Coordination Platform  
> **Stack:** Expo / React Native (TypeScript), Node.js/Express backend, OpenAI API  
> **Goal:** Hackathon-ready, polished, judge-facing product

---

## Legend

| Symbol | Meaning |
|--------|---------|
| 🔴 HIGH | Critical path — blocks later phases |
| 🟡 MEDIUM | Important but can be parallelized |
| 🟢 LOW | Nice-to-have / polish |
| ⚠️ RISK | Elevated complexity or integration risk |
| 📱 FE | Frontend (React Native / Expo) |
| 🛠️ BE | Backend (Node.js / Express) |
| 🤖 AI | OpenAI API / LLM Integration |
| 🗄️ DATA | Mock data / schema work |

---

## Phase 0 — Project Foundation & Scaffolding

**Milestone:** Runnable skeleton; shared design tokens; lint passing  
**Duration:** ~0.5 day | **Priority:** 🔴

### 0.1 Project Cleanup & Config
- [x] 📱 Remove default Expo template screens; clean `app/` to blank shell
- [x] 📱 Configure `tsconfig.json` strict mode + path alias `@/` → project root
- [x] 📱 Configure `babel.config.js` with `babel-plugin-module-resolver` for `@/`
- [x] 📱 Set up ESLint + Prettier with Expo rules
- [x] 🛠️ Initialize `/backend` with Express + TypeScript + nodemon + `ts-node`
- [x] 🛠️ Add `.env` handling via `dotenv`; add `.env.example` with all keys listed
- [x] 📱 Create `.env.local` with `EXPO_PUBLIC_API_URL`

### 0.2 Design System Bootstrap
- [x] 📱 Define `constants/Theme.ts` — colors, spacing scale, border radii, shadows, typography
- [x] 📱 Load Google Fonts via `expo-font` — `Nunito` (Urdu-friendly) + `Inter` (UI chrome)
- [x] 📱 Create base UI components in `components/ui/`: `Button`, `Card`, `Badge`, `Avatar`, `Chip`, `Divider`
- [x] 📱 Add dark/light mode support via `useColorScheme` + `ThemeContext`

### 0.3 Navigation Skeleton
- [x] 📱 Set up Expo Router file structure (see `PROJECT_STRUCTURE.md`)
- [x] 📱 Create bottom tab navigator: Home | Bookings | Providers | Profile
- [x] 📱 Create stack flows: Request → Understand → Match → Quote → Booking → Status → Feedback
- [x] 📱 Create modal stack: Dispute, ProviderDetail, Settings, Location Picker

### 0.4 Mock Data Foundation
- [x] 🗄️ Create `data/providers.json` — 15–20 providers with full schema (see README)
- [x] 🗄️ Create `data/services.json` — all service categories with pricing factors
- [x] 🗄️ Create `data/bookings.json` — 3–5 bookings in different lifecycle states
- [x] 🗄️ Create `data/users.json` — 2–3 user profiles with saved locations
- [x] 🗄️ Write TypeScript interfaces for all schemas in `types/`

> ⚠️ **RISK:** Thin mock data makes the matching engine look simplistic. Invest 2–3 hours here. Include providers that deliberately fail hard filters to make rejection logic demonstrable.

---

## Phase 1 — Core Request Capture Flow

**Milestone:** User types or speaks a request → OpenAI parses it → confirmation screen shown  
**Duration:** ~1.5 days | **Priority:** 🔴  
**Dependencies:** Phase 0

### 1.1 Home / Request Screen
- [x] 📱 Build `HomeScreen` with full-width text input
- [x] 📱 Add 8 quick-category shortcut tiles (Clinic Visit, Home Nurse, Caregiver, Physio, Medicine, Lab Sample, Meal Plan, Daily Support)
- [x] 📱 Add recent-requests list (from local state / `AsyncStorage`)
- [x] 📱 Add emergency / high-priority toggle with visual highlight
- [x] 📱 Animate category tiles on mount with staggered fade-in

### 1.2 Voice Input
- [x] 📱 `VoiceInputButton` placeholder with mic icon — deferred to Phase 7 (requires expo-dev-client)
- [x] 📱 Graceful placeholder: shows mic icon + informative "coming soon" alert; does not break Expo Go

> ⚠️ **RISK:** `@react-native-voice` requires `expo-dev-client` (not compatible with Expo Go). Configure `eas build --profile development` early to avoid last-minute blockers.

### 1.3 OpenAI Request Parser (Backend)
- [x] 🛠️ Create `POST /api/parse-request` endpoint
- [x] 🤖 Write structured OpenAI prompt for: service bundle, patient, location, time, preferences, risk level, confidence score, clarification question
- [x] 🛠️ Implement `LLMProvider` interface with `parseRequest(input): ParsedRequest` method
- [x] 🛠️ Below-confidence threshold (< 0.7) → set `clarification_needed: true`
- [x] 🛠️ API failure → return fallback object triggering manual category form on FE

### 1.4 Understanding / Confirmation Screen
- [x] 📱 Build `UnderstandingScreen` showing extracted: service bundle, patient, time, location, preferences, risk, confidence badge
- [x] 📱 Clarification question UI when `clarification_needed: true`
- [x] 📱 Allow tap-to-edit each field
- [x] 📱 "Looks Right" / "Edit" CTAs

---

## Phase 2 — Provider Matching Engine

**Milestone:** Backend returns ranked provider list with scores and OpenAI explanations  
**Duration:** ~1.5 days | **Priority:** 🔴  
**Dependencies:** Phase 1 + mock data

### 2.1 Matching Engine Core
- [x] 🛠️ Create `services/matchingEngine.ts`
- [x] **Stage 1 — Hard Filters:**
  - [x] Service type must match
  - [x] Provider must serve requested area/city
  - [x] Provider must be available (no slot conflict)
  - [x] Home visit supported if requested
  - [x] Female/Male provider filter — HARD REJECT if explicitly required
  - [x] Language filter — hard if marked critical
  - [x] Verified provider required for high-risk services
  - [x] Wheelchair support required if requested
- [x] **Stage 2 — Weighted Scoring:**

  | Factor | Default Weight |
  |--------|---------------|
  | Specialization match | 20% |
  | Availability fit | 15% |
  | Reliability / on-time score | 15% |
  | Language match | 10% |
  | Gender / comfort fit | 10% |
  | Rating + review recency | 10% |
  | Cancellation risk (inverted) | 10% |
  | Distance / travel time | 5% |
  | Price fit | 5% |

- [x] 🛠️ Make weights configurable by service category (nursing → gender/verification weighted higher)
- [x] 🛠️ Return top 3 matches + rejection reasons for filtered providers
- [x] 🛠️ `POST /api/match` endpoint

### 2.2 Distance & Travel Time Utilities
- [x] 🛠️ Implement `utils/haversine.ts` for straight-line distance
- [x] 🛠️ `estimateTravelTime(km): minutes` = `km * 3.5 + traffic_buffer`
- [x] 🛠️ Add 15-minute elder-care buffer to all estimates
- [x] 🛠️ Return `{ distance_km, travel_time_minutes, elder_buffer, suggested_arrival_buffer }` per provider

### 2.3 OpenAI Match Explanation
- [x] 🤖 Implement `LLMProvider.explainMatch(request, provider, score): string` — 2–3 sentence natural explanation
- [x] 🤖 Generate human-readable rejection reasons for filtered providers
- [x] 🛠️ Cache explanations by `hash(request + providerId)` to avoid redundant API calls

### 2.4 Match Results Screen
- [x] 📱 Build `MatchResultsScreen` — top recommended card (full-width) + 2 alternative cards
- [x] 📱 Trust badges: Verified ✓, Gender icon, Languages, On-time %, Star rating
- [x] 📱 Expandable "Why selected" with OpenAI explanation
- [x] 📱 Collapsible "Why others weren't recommended" section
- [x] 📱 Provider profile detail modal on tap
- [x] 📱 Slide-up card entrance animation

> ⚠️ **RISK:** Gender filter must be a hard reject, not a soft preference. Incorrect behavior is a product safety issue. Unit test this exhaustively.

---

## Phase 3 — Pricing, Quote & Booking

**Milestone:** Transparent quote → booking confirmed → provider assigned  
**Duration:** ~1 day | **Priority:** 🔴  
**Dependencies:** Phase 2

### 3.1 Pricing Engine
- [x] 🛠️ Create `services/pricingEngine.ts`
- [x] Implement formula: `base + distance_fee + waiting_time + complexity + urgency + add_ons - loyalty_discount`
- [x] Return itemized `PricingBreakdown[]` with label + amount per line
- [x] Add cheaper alternate slot suggestion when urgency fee applies
- [x] `POST /api/quote` endpoint

### 3.2 Quote Screen
- [x] 📱 Build `QuoteScreen` — itemized line items with animated sequential reveal
- [x] 📱 Total prominently highlighted
- [x] 📱 "Alternate cheaper slot" secondary CTA
- [x] 📱 "Book Now" primary + "Change Provider" secondary

### 3.3 Booking Simulator
- [x] 🛠️ Create `services/bookingSimulator.ts`
- [x] `POST /api/bookings` → create booking record, assign provider, set `status: confirmed`
- [x] Simulate family notification event (return notification payload)
- [x] Simulate T-60 min reminder event

### 3.4 Booking Confirmation Screen
- [x] 📱 Build `BookingConfirmationScreen` with booking ID, provider, time, total
- [x] 📱 Animated success checkmark
- [x] 📱 "Family notified" status indicator
- [x] 📱 "Track Status" CTA

---

## Phase 4 — Booking Lifecycle & Live Status

**Milestone:** Full timeline visible; status advances in real-time simulation  
**Duration:** ~1 day | **Priority:** 🔴  
**Dependencies:** Phase 3

### 4.1 Booking Timeline Screen
- [x] 📱 Vertical step timeline: Request Confirmed → Provider Assigned → Family Notified → En Route → Visit Started → Completed → Proof Uploaded → Feedback
- [x] 📱 Each step shows timestamp + status icon (pending / active / done)
- [x] 📱 Animate step completion with checkmark transition

### 4.2 Live Status Simulation
- [x] 🛠️ `POST /api/bookings/:id/simulate` — advance status by one step
- [x] 📱 Frontend polls `GET /api/bookings/:id/status` every 5 seconds
- [x] 📱 Display current status banner: "Provider en route · 24 min away"
- [x] 📱 Static map placeholder with mock provider dot
- [x] 📱 Handle edge: provider delayed, provider cancelled mid-transit

### 4.3 Provider Dashboard Screen
- [x] 📱 `ProviderDashboardScreen` — today's jobs list, earnings estimate, cancellation warning, recommended slots
- [x] 📱 Accessible via Profile tab or demo toggle

---

## Phase 5 — Feedback, Dispute & Reputation

**Milestone:** Post-service quality loop complete; dispute flow demonstrable  
**Duration:** ~1 day | **Priority:** 🟡  
**Dependencies:** Phase 4

### 5.1 Feedback Screen
- [x] 📱 5-star rating component
- [x] 📱 Service confirmation checklist (per service type)
- [x] 📱 Photo/receipt upload placeholder
- [x] 📱 Complaint reason multi-select chips
- [x] 📱 Submit → reputation update trigger

### 5.2 Dispute Engine
- [x] 🛠️ Create `services/disputeEngine.ts`
- [x] Handle types: no-show, late arrival, extra charge, incomplete, safety concern
- [x] Recommendation logic: refund / revisit / human escalation
- [x] `POST /api/disputes` endpoint
- [x] 🤖 `LLMProvider.summarizeDispute(dispute): string` — human-readable summary

### 5.3 Dispute Screen
- [x] 📱 Dispute type selection
- [x] 📱 OpenAI dispute summary display
- [x] 📱 Resolution recommendation card
- [x] 📱 "Human agent notified" escalation simulation

### 5.4 Reputation Update
- [x] 🛠️ `POST /api/providers/:id/reputation` — update rating, on-time score, cancellation rate in memory
- [x] 🛠️ Updated reputation feeds into next match cycle

---

## Phase 6 — Edge Cases & Fallback Scenarios

**Milestone:** All 8 robustness cases from README demonstrable  
**Duration:** ~0.5–1 day | **Priority:** 🟡  
**Dependencies:** Phases 1–5

| # | Edge Case | Implementation |
|---|-----------|---------------|
| 1 | Ambiguous request | Low confidence → clarification question UI |
| 2 | Missing location | Location clarification modal |
| 3 | No female provider available | "No female provider in area" screen + suggestions |
| 4 | Provider cancellation | Re-rank, notify family, offer replacement + compensation |
| 5 | Overlapping booking | Detect conflict, suggest next slot |
| 6 | Extra charge dispute | Route to dispute flow with refund recommendation |
| 7 | OpenAI confidence < threshold | Show manual category form fallback |
| 8 | API failure | Offline banner; cached provider list fallback |

### 6.1 Cancellation & Fallback Engine
- [x] 🛠️ `POST /api/bookings/:id/cancel` — triggers re-ranking excluding cancelled provider
- [x] 🛠️ Apply `compensation_discount` to replacement quote
- [x] 🛠️ Family notification payload for cancellation

---

## Phase 7 — Demo Scenarios, Polish & Onboarding

**Milestone:** All 5 demo scenarios (A–E) scriptable end-to-end; UI polished  
**Duration:** ~1 day | **Priority:** 🟡  
**Dependencies:** Phases 1–6

### 7.1 Demo Mode
- [x] 📱 "Demo Mode" toggle in Settings (seeds specific scenario data)
- [x] 📱 Pre-filled example requests per scenario (tap to auto-fill)
- [x] 🗄️ `data/demo-scenarios.json` with 5 scripted inputs + expected outputs
- [x] 🛠️ `POST /api/demo/scenario/:id` — load a specific scenario state

### 7.2 UI Polish
- [x] 📱 Loading skeletons on all data-fetching screens
- [x] 📱 Empty states with helpful prompts
- [x] 📱 Error states with retry buttons
- [x] 📱 Safe-area awareness on all screens (notch, home indicator)
- [x] 📱 Haptic feedback: booking confirm, rating, dispute submit
- [x] 📱 Verify Urdu/Arabic-script text renders correctly; add RTL support if needed

### 7.3 Onboarding (🟢 LOW)
- [x] 📱 3-slide onboarding (first-launch only, store flag in `AsyncStorage`)
- [x] 📱 Profile setup: name, saved home address, language preference

---

## Phase 8 — Testing & QA

**Milestone:** Critical paths tested; all 5 demo scenarios verified manually  
**Duration:** ~0.5–1 day | **Priority:** 🟡

### 8.1 Backend Unit Tests
- [x] 🛠️ Install Jest + Supertest
- [x] Matching Engine: hard filter combinations (gender, service type, availability)
- [x] Pricing Engine: formula correctness with known inputs
- [x] Dispute Engine: recommendation logic
- [x] Haversine: distance calculation accuracy

### 8.2 Frontend Component Tests
- [x] 📱 Install `@testing-library/react-native`
- [x] `HomeScreen` — input, category selection, submit
- [x] `MatchResultsScreen` — recommended + alternatives render correctly
- [x] `QuoteScreen` — correct total from itemized breakdown

### 8.3 Manual E2E QA
- [ ] Walk through all 5 demo scenarios (A–E) end-to-end
- [ ] Verify all 8 fallback/robustness cases

---

## Phase 9 — Judge Delivery & Submission

**Milestone:** Judge-friendly Expo preview/APK ready; demo works without requiring judges to configure backend hosting  
**Duration:** ~0.5 day | **Priority:** 🔴

### 9.1 Judge-Friendly Runtime
- [x] 🛠️ Document live OpenAI judging path with `REQUIRE_LIVE_AGENTS=true` and `DEMO_SEEDED_PARSE=false`
- [x] 🛠️ Keep local backend support for development via `EXPO_PUBLIC_API_URL=http://localhost:3001`
- [x] 🛠️ Add `/api/agent/status` so judges can verify live agent readiness before demo
- [ ] 🛠️ Smoke-test the full live API journey on the final demo machine before submission

### 9.2 Expo Preview / Mobile Build
- [ ] 📱 Publish an Expo preview link when the feature set is compatible with Expo Go
- [ ] 📱 `eas build --profile preview --platform android` → APK when native modules/dev-client features are used
- [ ] 📱 Test on physical Android device
- [ ] 📱 Verify all permissions declared in `app.json`

### 9.3 Submission Artifacts
- [ ] Update `README.md` with setup + demo instructions
- [ ] Record 2-minute demo video (Scenario A + Scenario E)
- [ ] (Optional) Judge-facing one-pager

---

## Complexity & Risk Summary

| Risk Area | Level | Mitigation |
|-----------|-------|------------|
| OpenAI API latency / rate limits | 🔴 HIGH | Cache responses; loading states; fallback form |
| `@react-native-voice` native module | 🟡 MEDIUM | Use `expo-dev-client`; test on device early |
| Gender/preference hard filter correctness | 🔴 HIGH | Unit test all filter combinations |
| Multilingual text rendering (Urdu) | 🟡 MEDIUM | Test Urdu chars early; check RTL |
| Judge runtime reliability | 🔴 HIGH | Use a prepared backend with live OpenAI credentials; verify `/api/agent/status` before presenting |
| Expo Go vs Dev Client | 🟡 MEDIUM | Decide early; go Dev Client if using native modules |
| Real-time status without WebSockets | 🟢 LOW | 5s polling sufficient for demo |


