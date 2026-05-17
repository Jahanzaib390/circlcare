# Phase 1 — Core Request Capture Flow

Build the full user-facing flow from entering a care request → Gemini parsing → confirmation screen, plus the backend `POST /api/parse-request` endpoint that powers it.

---

## Current State (after Phase 0)

| Area | Status |
|------|--------|
| Home screen (`app/(tabs)/index.tsx`) | Placeholder — just a title/subtitle |
| `app/request/understand.tsx` | Placeholder stub |
| `backend/src/routes/parseRoutes.ts` | Stub returning 501 |
| `backend/src/llm/` | Empty directory |
| `backend/src/services/` | Empty directory |
| `types/request.ts` | ✅ `ParsedRequest` fully typed |
| `constants/Config.ts` | ✅ `confidenceThreshold: 0.7` defined |
| `constants/ServiceCategories.ts` | ✅ All 8 categories defined |
| `components/ui/` | ✅ Button, Card, Badge, Avatar, Chip, Divider |

---

## Proposed Changes

### 1.1 — HomeScreen (Full Build)

#### [MODIFY] [index.tsx](file:///c:/Users/Jahan/Documents/circlcare/app/(tabs)/index.tsx)

Replace the placeholder with a full screen featuring:
- **Header**: Greeting + user avatar (right-aligned), Gemini-powered tagline
- **Full-width text input card**: Multi-line, auto-grows, submit on send icon
- **Emergency toggle**: A toggle row that turns the card border red and sets urgency
- **8 category shortcut tiles**: 2×4 grid using the existing `ServiceCategories` const; icons from `@expo/vector-icons`
- **Recent requests list**: Read from Zustand store (loaded from `AsyncStorage` on mount); shows last 5 entries with a tap-to-reuse gesture
- **Staggered fade-in animation** on category tiles using `Animated.stagger` or `react-native-reanimated` `FadeInDown` with delay offsets

**Navigation**: Submit/category tap → `router.push('/request/understand', { params: { rawRequest, isEmergency } })`

---

### 1.2 — Voice Input

> ⚠️ **RISK — requires native module / dev-client**

#### [NEW] [VoiceInputButton.tsx](file:///c:/Users/Jahan/Documents/circlcare/components/ui/VoiceInputButton.tsx)

- Install `@react-native-voice/voice`; add mic permissions to `app.json`
- State machine: `idle → listening → transcribing → ready → error`
- Animated pulsing mic ring using `react-native-reanimated` repeating scale animation
- Partial transcript fed into the home screen text input in real time
- On error: show partial text + inline edit prompt (no modal needed)

> [!IMPORTANT]
> **Decision required**: `@react-native-voice` requires `expo-dev-client`. The current project uses Expo Go. We have two options:
> 1. **Proceed with dev-client** — adds `eas build --profile development` step; best for demo
> 2. **Defer voice to Phase 7 polish** — keep Expo Go compatibility now; add voice later
>
> **Recommendation**: Defer voice to a later phase and use a mock/no-op `VoiceInputButton` placeholder for now. This keeps the demo runnable without EAS builds. The placeholder button will show the mic icon but display a "Voice coming soon" toast. This is the safer hackathon path.

---

### 1.3 — Gemini Request Parser (Backend)

#### [NEW] [llmProvider.ts](file:///c:/Users/Jahan/Documents/circlcare/backend/src/llm/llmProvider.ts)

Defines the `LLMProvider` interface:
```typescript
interface LLMProvider {
  parseRequest(input: string): Promise<ParsedRequest>;
  explainMatch(request: ParsedRequest, provider: Provider, score: number): Promise<string>;
  summarizeDispute(dispute: Dispute): Promise<string>;
}
```

#### [NEW] [geminiProvider.ts](file:///c:/Users/Jahan/Documents/circlcare/backend/src/llm/geminiProvider.ts)

Implements `LLMProvider` using the Gemini REST API (`@google/generative-ai` SDK):
- Structured prompt instructs Gemini to return a JSON object matching `ParsedRequest`
- Uses `responseMimeType: "application/json"` for reliable structured output
- Confidence < 0.7 → sets `clarification_needed: true` + generates `clarification_question`
- Includes service category extraction, patient name/relationship, location, time, preferences, urgency, risk

#### [NEW] [mockProvider.ts](file:///c:/Users/Jahan/Documents/circlcare/backend/src/llm/mockProvider.ts)

Deterministic mock implementation of `LLMProvider` — returns hardcoded `ParsedRequest` objects based on keyword matching. Used when `GEMINI_KEY` is absent or `DEMO_MODE=true`.

#### [MODIFY] [parseRoutes.ts](file:///c:/Users/Jahan/Documents/circlcare/backend/src/routes/parseRoutes.ts)

- `POST /api/parse-request` → validate `{ text: string }` body → call `llmProvider.parseRequest(text)` → return `ParsedRequest`
- API failure → return fallback object with `clarification_needed: true, confidence: 0`

---

### 1.4 — Understanding / Confirmation Screen

#### [MODIFY] [understand.tsx](file:///c:/Users/Jahan/Documents/circlcare/app/request/understand.tsx)

Full screen implementation:
- **Loading state**: Skeleton cards while `POST /api/parse-request` is in flight
- **Result display**: Styled info cards for each extracted field:
  - Service(s) detected (with category icons + Badge chips)
  - Patient name/relationship
  - Date/time preference
  - Location
  - Provider preferences (gender, language, verified)
  - Risk/urgency badge (color-coded)
  - Confidence meter bar
- **Clarification UI** (when `clarification_needed: true`): Prominent question card with a text input and "Answer" button; re-submits to the API
- **Tap-to-edit**: Each field card is tappable; tapping opens an inline edit input or bottom sheet
- **CTAs**: "Looks right →" (proceed to match) and "✏️ Edit request" (back to home with text pre-filled)

---

### Supporting Infrastructure

#### [NEW] [useRequestStore.ts](file:///c:/Users/Jahan/Documents/circlcare/hooks/useRequestStore.ts)

Zustand store managing:
- `rawRequest: string` — current text
- `parsedRequest: ParsedRequest | null`
- `recentRequests: RecentRequest[]` — persisted via `AsyncStorage`
- `isEmergency: boolean`
- Actions: `setRawRequest`, `setParsedRequest`, `addRecentRequest`, `clearCurrent`

#### [NEW] [useParseRequest.ts](file:///c:/Users/Jahan/Documents/circlcare/hooks/useParseRequest.ts)

TanStack Query mutation hook:
- `useMutation` calling `POST /api/parse-request`
- Returns `{ mutate, isPending, isError, data }`
- On success: updates Zustand store + navigates to `/request/understand`

#### [NEW] [apiClient.ts](file:///c:/Users/Jahan/Documents/circlcare/services/apiClient.ts)

Thin `fetch`-based API client with:
- Base URL from `Config.apiBaseUrl`
- `timeout: Config.apiTimeoutMs`
- `post<T>(path, body): Promise<T>` helper
- Network error → throws typed `ApiError`

---

## Open Questions

> [!IMPORTANT]
> **Voice Input Strategy**: Implement `@react-native-voice` now (requires EAS dev-client build) or defer with a UI placeholder? Default plan is to defer — please confirm.

> [!NOTE]
> **Gemini Key for Demo**: The backend falls back to `mockProvider` automatically when `GEMINI_KEY` is not set. Live Gemini parsing will work when the key is configured in `backend/.env`. No judge setup required.

---

## File Summary

| File | Action | Layer |
|------|--------|-------|
| `app/(tabs)/index.tsx` | MODIFY (full rebuild) | FE |
| `app/request/understand.tsx` | MODIFY (full rebuild) | FE |
| `components/ui/VoiceInputButton.tsx` | NEW (placeholder mic button) | FE |
| `hooks/useRequestStore.ts` | NEW (Zustand store) | FE |
| `hooks/useParseRequest.ts` | NEW (TanStack Query mutation) | FE |
| `services/apiClient.ts` | NEW (fetch wrapper) | FE |
| `backend/src/llm/llmProvider.ts` | NEW (interface) | BE |
| `backend/src/llm/geminiProvider.ts` | NEW (Gemini implementation) | BE |
| `backend/src/llm/mockProvider.ts` | NEW (mock/deterministic) | BE |
| `backend/src/routes/parseRoutes.ts` | MODIFY (implement endpoint) | BE |
| `ACTION_PLAN.md` | MODIFY (mark Phase 1 items ✅) | DOCS |

---

## Verification Plan

### Automated
- Start backend: `cd backend && npm run dev` → `GET /health` returns 200
- Test parse endpoint: `curl -X POST localhost:3001/api/parse-request -d '{"text":"I need a female nurse for my mother tomorrow morning"}'`
- Verify mock fallback works when `GEMINI_KEY` is unset

### Manual (Expo)
- `npm start` → open in Expo Go (or simulator)
- Home screen: all 8 category tiles visible with stagger animation
- Type a request, tap send → navigates to Understand screen
- Understand screen shows skeleton → populates with extracted fields
- Tap "Looks right" → navigates to `/request/match` (Phase 2 stub)
- Tap "Edit" → returns to Home with text pre-filled
- Set emergency toggle ON → input card border turns red
