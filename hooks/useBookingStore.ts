import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Booking, BookingNotificationPayload } from '@/types/booking';

interface BookingState {
  booking: Booking | null;
  bookings: Booking[];
  familyNotification: BookingNotificationPayload | null;
  reminderEvent: BookingNotificationPayload | null;
  setBooking: (
    booking: Booking | null,
    familyNotification?: BookingNotificationPayload | null,
    reminderEvent?: BookingNotificationPayload | null
  ) => void;
  upsertBooking: (booking: Booking) => void;
  clearBooking: () => void;
  clearBookings: () => void;
}

function upsert(list: Booking[], booking: Booking): Booking[] {
  const next = [booking, ...list.filter((item) => item.booking_id !== booking.booking_id)];
  return next.sort(
    (a, b) => new Date(b.scheduled_start).getTime() - new Date(a.scheduled_start).getTime()
  );
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set) => ({
      booking: null,
      bookings: [],
      familyNotification: null,
      reminderEvent: null,
      setBooking: (booking, familyNotification, reminderEvent) =>
        set((state) => ({
          booking,
          bookings: booking ? upsert(state.bookings, booking) : state.bookings,
          familyNotification:
            familyNotification === undefined ? state.familyNotification : familyNotification,
          reminderEvent: reminderEvent === undefined ? state.reminderEvent : reminderEvent,
        })),
      upsertBooking: (booking) =>
        set((state) => ({
          booking,
          bookings: upsert(state.bookings, booking),
        })),
      clearBooking: () => set({ booking: null, familyNotification: null, reminderEvent: null }),
      clearBookings: () => set({ booking: null, bookings: [] }),
    }),
    {
      name: 'circlcare_bookings',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ booking: state.booking, bookings: state.bookings }),
    }
  )
);
