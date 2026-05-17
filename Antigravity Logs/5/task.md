# Phase 3 — Task Checklist

## Backend

- [x] `backend/src/types/pricing.ts` — backend pricing type mirror
- [x] `backend/src/services/pricingEngine.ts` — full pricing formula
- [x] `backend/src/routes/quoteRoutes.ts` — wire POST /api/quote
- [x] `backend/src/services/bookingSimulator.ts` — in-memory booking lifecycle
- [x] `backend/src/routes/bookingRoutes.ts` — wire all 5 booking routes

## Frontend Hooks & Stores

- [x] `hooks/useQuoteStore.ts` — Zustand store for PricingBreakdown
- [x] `hooks/useQuote.ts` — React Query mutation for POST /api/quote
- [x] `hooks/useBookingStore.ts` — Zustand store for active Booking
- [x] `hooks/useBooking.ts` — React Query mutation for POST /api/bookings

## Frontend Screens

- [x] `app/request/quote.tsx` — full QuoteScreen with animated line items
- [x] `app/request/confirm.tsx` — BookingConfirmationScreen with success animation

## ACTION_PLAN.md

- [x] Mark Phase 3 tasks as completed in ACTION_PLAN.md
