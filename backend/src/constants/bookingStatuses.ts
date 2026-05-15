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

export const BOOKING_TIMELINE_STEPS: BookingStatus[] = [
  'confirmed',
  'provider_assigned',
  'family_notified',
  'en_route',
  'in_progress',
  'completed',
  'proof_uploaded',
  'feedback_collected',
];
