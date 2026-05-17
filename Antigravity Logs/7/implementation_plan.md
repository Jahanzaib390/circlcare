# Phase 5 Implementation Plan

This document outlines the steps to complete Phase 5 (Feedback, Dispute & Reputation) of the CirclCare AI project.

## User Review Required

> [!IMPORTANT]
> The reputation updates will be handled purely in memory since there is no database. When the backend restarts, reputation scores will reset to their original values in `providers.json`.

## Proposed Changes

### Backend Services & Routes

#### [NEW] `backend/src/llm/llmFactory.ts`
- Extract the `getLLM()` function from `matchRoutes.ts` into a shared factory so it can be used across multiple routes (e.g., `matchRoutes.ts` and `disputeRoutes.ts`).

#### [MODIFY] `backend/src/routes/matchRoutes.ts`
- Update to import `getLLM` from the new factory instead of defining it locally.

#### [NEW] `backend/src/services/disputeEngine.ts`
- Implement `recommendResolution(dispute: Dispute): DisputeRecommendation`
- Handle dispute types: `no_show`, `late_arrival`, `extra_charge`, `incomplete`, `safety_concern`.
- Map types to recommendations (`refund`, `revisit`, `human_escalation`) and return a human-readable reason.

#### [MODIFY] `backend/src/routes/disputeRoutes.ts`
- Implement `POST /api/disputes`.
- Parse the incoming `Dispute` object.
- Call `recommendResolution` from `disputeEngine`.
- Call `llm.summarizeDispute(dispute)` to generate a human-readable summary.
- Return the summary and recommendation.

#### [MODIFY] `backend/src/routes/providerRoutes.ts`
- Implement `POST /api/providers/:id/reputation`.
- Find the provider in the in-memory array.
- Update `rating`, `on_time_score`, and `cancellation_rate` based on the payload.
- This will ensure the updated reputation feeds into the next match cycle (as `matchingEngine` and `matchRoutes` read from the in-memory/loaded array). 
- Wait, currently `matchRoutes` does `loadProviders()` from JSON on *every request*. So we need to introduce a cached in-memory array of providers in the backend so mutations persist across requests (until server restart).

#### [NEW/MODIFY] `backend/src/services/providerData.ts`
- Create a utility to load `providers.json` once, cache it in memory, and export functions to `getProviders()` and `updateProvider(id, updates)`.
- Update `matchRoutes.ts` and `providerRoutes.ts` to use this shared state so reputation updates are reflected in subsequent matches.

---

### Frontend Screens

#### [MODIFY] `app/request/feedback.tsx`
- Build the 5-star rating component.
- Add a service confirmation checklist.
- Add a photo/receipt upload placeholder UI.
- Add complaint reason multi-select chips.
- Add a Submit button that triggers the `/api/providers/:id/reputation` endpoint and navigates back to Home or to the Dispute screen if a complaint is selected.

#### [MODIFY] `app/modals/dispute.tsx`
- Implement the Dispute screen UI.
- Add dispute type selection.
- Make a call to `/api/disputes` and display the returned Gemini dispute summary.
- Display the Resolution Recommendation card.
- Add a simulated "Human agent notified" state.

## Verification Plan

### Automated Tests
- No new automated tests are strictly required in this phase per the action plan, but standard type checking and linting will be run.

### Manual Verification
1. Open the app, navigate through a booking, and reach the feedback stage.
2. Submit positive feedback and verify the provider's rating increases in memory (can be checked by matching again).
3. Select a complaint reason and trigger the dispute flow.
4. Verify the dispute screen correctly calls the backend, displays the Gemini summary, and shows the recommended action.
