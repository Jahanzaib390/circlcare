import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { useBookingStore } from '@/hooks/useBookingStore';
import type { Booking, BookingNotificationPayload } from '@/types/booking';
import type { Provider } from '@/types/provider';
import type { ParsedRequest } from '@/types/request';
import type { PricingBreakdown } from '@/types/pricing';

interface CreateBookingVariables {
  provider: Provider;
  request: ParsedRequest;
  pricing: PricingBreakdown;
}

interface CreateBookingResponse {
  booking: Booking;
  family_notification: BookingNotificationPayload;
  reminder_event: BookingNotificationPayload;
}

export function useBooking() {
  const { setBooking } = useBookingStore();

  return useMutation<CreateBookingResponse, Error, CreateBookingVariables>({
    mutationFn: (variables) => apiClient.post<CreateBookingResponse>('/api/bookings', variables),
    onSuccess: (data) => {
      setBooking(data.booking, data.family_notification, data.reminder_event);
    },
    onError: (err) => {
      console.error('[useBooking] Error:', err.message);
    },
  });
}
