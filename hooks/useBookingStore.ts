import { create } from 'zustand';
import type { Booking, BookingNotificationPayload } from '@/types/booking';

interface BookingState {
  booking: Booking | null;
  familyNotification: BookingNotificationPayload | null;
  reminderEvent: BookingNotificationPayload | null;
  setBooking: (
    booking: Booking | null,
    familyNotification?: BookingNotificationPayload | null,
    reminderEvent?: BookingNotificationPayload | null
  ) => void;
  clearBooking: () => void;
}

export const useBookingStore = create<BookingState>()((set) => ({
  booking: null,
  familyNotification: null,
  reminderEvent: null,
  setBooking: (booking, familyNotification, reminderEvent) =>
    set((state) => ({
      booking,
      familyNotification:
        familyNotification === undefined ? state.familyNotification : familyNotification,
      reminderEvent: reminderEvent === undefined ? state.reminderEvent : reminderEvent,
    })),
  clearBooking: () => set({ booking: null, familyNotification: null, reminderEvent: null }),
}));
