# Phase 4 — Booking Lifecycle & Live Status

Implement the full booking tracking experience: a vertical step-by-step timeline view, real-time simulation via polling, and a Provider Dashboard reachable from the Profile tab.

---

## Background

Phases 0–3 are complete. The backend already has:
- `bookingSimulator.ts` — `createBooking`, `simulateNextStep`, `cancelBooking`, in-memory store
- `GET /api/bookings/:id/status` — returns `{ status, timeline, provider_eta_minutes, family_notified }`
- `POST /api/bookings/:id/simulate` — advances status by one step
- `BOOKING_TIMELINE_STEPS` constant: `confirmed → provider_assigned → family_notified → en_route → arrived → in_progress → completed → proof_uploaded → feedback_collected`

The frontend stub at `app/request/status.tsx` is empty (just a title). The Profile tab is also a stub.

---

## Proposed Changes

### 4.1 — Booking Timeline Screen (`app/request/status.tsx`)

#### [MODIFY] [status.tsx](file:///c:/Users/Jahan/Documents/circlcare/app/request/status.tsx)

Full rebuild of the stub into a rich, animated vertical timeline screen:

- **Header**: Back button + "Booking Status" title + booking ID chip
- **Status Banner**: Prominent card showing current status label + color, ETA text when `en_route` (`Provider en route · 24 min away`), static map placeholder SVG with a pulsing provider dot
- **Vertical Timeline**: 9 steps rendered as a step list
  - Each step: icon (pending ○ / active ● pulsing / done ✓), label, timestamp (when reached), status icon
  - Animate step completion with a scale+fade checkmark transition using `Animated`
- **Edge case cards**: "Provider Delayed" or "Provider Cancelled" banners (conditionally rendered when status is `cancelled`)
- **CTA**: "Simulate Next Step" button for demo purposes, "Leave Feedback" shown when `completed`
- Polling: `useEffect` with `setInterval` every 5 seconds calling `GET /api/bookings/:id/status`

---

### 4.1b — New hook: `useBookingStatus.ts`

#### [NEW] [useBookingStatus.ts](file:///c:/Users/Jahan/Documents/circlcare/hooks/useBookingStatus.ts)

```ts
// Polls /api/bookings/:id/status every 5 seconds
// Returns { status, timeline, provider_eta_minutes, family_notified, isLoading, error }
// Exposes simulateNextStep() function that calls POST /api/bookings/:id/simulate
```

---

### 4.2 — Live Status Simulation (Backend already done ✓)

The backend endpoints already exist:
- `GET /api/bookings/:id/status` ✓
- `POST /api/bookings/:id/simulate` ✓

No backend changes needed for 4.2.

---

### 4.3 — Provider Dashboard Screen

#### [MODIFY] [profile.tsx](file:///c:/Users/Jahan/Documents/circlcare/app/%28tabs%29/profile.tsx)

Rebuild the Profile tab to host both a user profile section and a **"Demo: Provider View"** toggle card that navigates to (or expands) the provider dashboard inline.

#### [NEW] [ProviderDashboardScreen.tsx](file:///c:/Users/Jahan/Documents/circlcare/app/modals/ProviderDashboard.tsx)

A standalone modal/screen accessible from Profile tab:

- **Header**: "Provider Dashboard" + today's date
- **Today's Jobs List**: Cards showing booking ID, service type, patient location, scheduled time, status chip
- **Earnings Estimate**: Total for the day with a styled highlighted box
- **Cancellation Warning**: Red banner if cancellation rate is high (mocked > 10%)
- **Recommended Slots**: 3 suggested available time slots for tomorrow

Uses mock data from `data/providers.json` and `data/bookings.json` (loaded locally, no extra endpoint needed for demo).

---

### Supporting Files

#### [MODIFY] [app/_layout.tsx](file:///c:/Users/Jahan/Documents/circlcare/app/_layout.tsx)

Ensure `modals/ProviderDashboard` is registered in the modal stack (it likely already has a modals stack slot).

#### [MODIFY] [ACTION_PLAN.md](file:///c:/Users/Jahan/Documents/circlcare/ACTION_PLAN.md)

Mark all Phase 4 tasks as `[x]` once implemented.

---

## Verification Plan

### Automated / Build
- `npx tsc --noEmit` — no TypeScript errors

### Manual Flow
1. Complete a booking (Phases 1–3 flow): confirm screen → tap "Track Provider Status"
2. `StatusScreen` loads → see step 1 (Confirmed) with timestamp
3. Tap "Simulate Next Step" → step advances, animation plays, banner updates
4. When `en_route`: banner shows "Provider en route · 24 min away"
5. Continue advancing to `completed` → "Leave Feedback" CTA appears
6. Navigate to Profile tab → tap "Provider Dashboard" → see jobs, earnings, slots

---

## Open Questions

> [!NOTE]
> The `useBookingStore` hook already holds the active `booking` object (with `booking_id`). The status screen will read the `booking_id` from this store to know which booking to poll. If the store is empty (user navigated directly), a fallback will load the most recent booking from the in-memory backend or show an empty state.

> [!IMPORTANT]
> The `POST /api/bookings/:id/simulate` is destructive (advances state permanently in the in-memory store). For demo purposes this is fine, but the "Simulate" button will be clearly labeled as a demo action.
