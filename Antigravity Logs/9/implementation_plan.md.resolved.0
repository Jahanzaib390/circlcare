# Implement Phase 7: Demo Scenarios, Polish & Onboarding

This plan covers the Phase 7 tasks outlined in `ACTION_PLAN.md`, focusing on making the product judge-ready with scripted demo scenarios, polished UI/UX, and an onboarding flow.

## User Review Required

> [!IMPORTANT]  
> The onboarding flow (Phase 7.3) requires adding an `AsyncStorage` flag to detect the first launch and show a 3-slide onboarding screen before navigating to the main app. This will change the app's initial routing behavior. Please confirm if this is acceptable.

## Open Questions

> [!WARNING]
> Do we want the Demo Scenarios (A-E) to auto-fill the request box on the HomeScreen, or should they actually trigger the `POST /api/demo/scenario/:id` backend route to hardcode the app's entire mock state (like bypassing matching engine)? The plan currently assumes both: tapping a demo scenario fills the text, and the backend route prepares any specific deterministic mock state needed for that scenario.
> Are there any specific libraries you'd prefer for Loading Skeletons (e.g., `moti/skeleton` or simple animated views)? I plan to use simple Reanimated/Animated views to keep dependencies minimal unless otherwise specified.

## Proposed Changes

### Demo Mode (7.1)

#### [NEW] `data/demo-scenarios.json`
- Create a JSON file containing the 5 scenarios (A-E) detailed in the README (Clinic Visit Bundle, Recurring Caregiver, Home Physiotherapy, Food/Medicine Support, Failure/Fallback).

#### [MODIFY] `backend/src/routes/demoRoutes.ts`
- Implement `POST /api/demo/scenario/:id`.
- For now, it will load the scenario details from `demo-scenarios.json` and reset/seed the mock database (like `data/bookings.json` or `data/providers.json`) to deterministic states if needed for specific scenarios like E (Failure).

#### [MODIFY] `app/modals/settings.tsx`
- Add a "Demo Mode" toggle switch.
- Store the toggle state in a global context or `AsyncStorage`.

#### [MODIFY] `app/(tabs)/index.tsx` (Home Screen)
- If "Demo Mode" is active, display 5 shortcut buttons for Scenarios A-E.
- Tapping a shortcut auto-fills the text input with the scenario's natural language request.

---

### UI Polish (7.2)

#### [MODIFY] Screens (`app/(tabs)/index.tsx`, `app/request/match.tsx`, etc.)
- Wrap main screens in `SafeAreaView` from `react-native-safe-area-context` to ensure notch and home indicator awareness.

#### [NEW] `components/ui/Skeleton.tsx`
- Create a reusable loading skeleton component using `react-native-reanimated` for a shimmer effect.
- Apply skeletons to data-fetching areas (Match Results, Provider Dashboard).

#### [NEW] `components/ui/EmptyState.tsx` & `ErrorState.tsx`
- Create generic components for empty states (e.g., no recent requests) and error states (e.g., API failure) with retry buttons.
- Integrate into relevant screens.

#### [MODIFY] `app/request/booking-status.tsx`, `app/modals/dispute.tsx`, etc.
- Integrate `expo-haptics` (`Haptics.notificationAsync`, `Haptics.impactAsync`) for key actions: booking confirmation, rating submission, and dispute submission.

---

### Onboarding (7.3)

#### [NEW] `app/onboarding.tsx`
- Create a 3-slide onboarding screen explaining the app's value proposition (Multilingual, Trusted Matches, Full Coordination).
- Final slide includes a quick profile setup (Name, saved home address, language preference).
- Save completion flag to `AsyncStorage`.

#### [MODIFY] `app/_layout.tsx`
- Add routing logic to check `AsyncStorage` for the onboarding flag on app start.
- If not set, route to `/onboarding`.
- If set, route to `/(tabs)`.

## Verification Plan

### Automated Tests
- Build the app and verify TypeScript compiles without errors.

### Manual Verification
- **Demo Scenarios:** Enable Demo Mode in Settings, tap Scenario A on Home Screen, verify text auto-fills, and submit to see expected behavior.
- **UI Polish:** 
  - Clear `AsyncStorage` / simulate slow network to view loading skeletons.
  - Verify empty states appear when no data is present.
  - Trigger haptic feedback on booking confirmation.
  - Check safe areas on a physical device or simulator with a notch.
- **Onboarding:** Clear app data, open app, verify routing to Onboarding screen, complete onboarding, restart app, verify routing directly to Home.
