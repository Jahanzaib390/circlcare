# Phase 6.1 Cancellation & Fallback Engine

This plan covers the implementation of the remaining tasks for Phase 6, specifically focusing on the backend fallback engine when a provider cancels a booking. It includes triggering a re-ranking of alternate providers, applying compensation discounts to replacement quotes, and generating family notification payloads.

## User Review Required
No breaking changes or significant UI overhauls are anticipated. This is primarily a backend logic expansion to fulfill the edge cases described in the action plan.

## Open Questions
- Is a `500 PKR` default compensation discount appropriate for the replacement quote? (Currently defined in `bookingSimulator.ts`, but this plan will formally surface it in the quotes).

## Proposed Changes

---

### Backend Types
#### [MODIFY] [booking.ts](file:///c:/Users/Jahan/Documents/circlcare/backend/src/types/booking.ts)
- Add `original_request?: ParsedRequest` to the `Booking` interface so the system can recall user requirements when re-matching after a cancellation.

---

### Backend Services
#### [MODIFY] [bookingSimulator.ts](file:///c:/Users/Jahan/Documents/circlcare/backend/src/services/bookingSimulator.ts)
- Update `createBooking` to assign the incoming `request` to the `original_request` field on the created booking.
- Modify `cancelBooking` to return an object containing both the updated `Booking` and a `BookingNotificationPayload` (of type `'provider_cancelled'`).
- Update `simulateNextStep` to accommodate the change in `cancelBooking`'s return type when the `mode` is `'cancel'`.

#### [MODIFY] [pricingEngine.ts](file:///c:/Users/Jahan/Documents/circlcare/backend/src/services/pricingEngine.ts)
- Update the signature of `calculateQuote` to accept an `options` object, adding support for `compensationDiscount?: number`.
- If `compensationDiscount` is provided, add it as a new `QuoteLineItem` with type `'discount'` (e.g., "Cancellation Compensation") and subtract it from the total.

---

### Backend Routes
#### [MODIFY] [bookingRoutes.ts](file:///c:/Users/Jahan/Documents/circlcare/backend/src/routes/bookingRoutes.ts)
- In `POST /bookings/:id/cancel`:
  - Call the updated `cancelBooking` to get the `booking` and `family_notification`.
  - Check if `original_request` exists on the booking.
  - If so, fetch all providers using `getProviders()`, and filter out the cancelled `booking.provider_id`.
  - Call `matchProviders` using the filtered provider list to get replacement matches.
  - For each top replacement match, generate a replacement quote using `calculateQuote`, passing in `booking.compensation_discount` as the `compensationDiscount`.
  - Respond with `booking`, `family_notification`, `replacements` (matches + quotes).
- Update the `POST /bookings/:id/simulate` route to correctly extract the booking from `cancelBooking` when mode is `'cancel'`.

---

## Verification Plan

### Automated Tests
N/A - the project does not currently have a comprehensive backend test suite running locally.

### Manual Verification
- We will manually trigger `POST /api/bookings/:id/cancel` via API testing (e.g., using `curl` or a REST client) to verify:
  - The cancelled provider is successfully excluded from the returned matches.
  - Replacement quotes contain the `Cancellation Compensation` line item.
  - The `family_notification` payload is correctly formed.
- We will ensure `simulateNextStep` still works for both standard advances and cancellations.
