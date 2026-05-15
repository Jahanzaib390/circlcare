/**
 * Booking lifecycle statuses.
 * Each status maps to a display label and a color (from Theme).
 */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'provider_assigned'
  | 'family_notified'
  | 'en_route'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'proof_uploaded'
  | 'feedback_collected'
  | 'cancelled'
  | 'disputed';

export const BookingStatusLabels: Record<BookingStatus, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  provider_assigned: 'Provider Assigned',
  family_notified: 'Family Notified',
  en_route: 'En Route',
  arrived: 'Arrived',
  in_progress: 'In Progress',
  completed: 'Completed',
  proof_uploaded: 'Proof Uploaded',
  feedback_collected: 'Feedback Collected',
  cancelled: 'Cancelled',
  disputed: 'Disputed',
};

export const BookingStatusColors: Record<BookingStatus, string> = {
  pending: '#F59E0B',
  confirmed: '#4F46E5',
  provider_assigned: '#4F46E5',
  family_notified: '#4F46E5',
  en_route: '#10B981',
  arrived: '#10B981',
  in_progress: '#10B981',
  completed: '#10B981',
  proof_uploaded: '#10B981',
  feedback_collected: '#10B981',
  cancelled: '#EF4444',
  disputed: '#EF4444',
};

/** Ordered lifecycle steps for the timeline view */
export const BOOKING_TIMELINE_STEPS: BookingStatus[] = [
  'confirmed',
  'provider_assigned',
  'family_notified',
  'en_route',
  'arrived',
  'in_progress',
  'completed',
  'proof_uploaded',
  'feedback_collected',
];
