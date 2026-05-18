import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useBookingStore } from '@/hooks/useBookingStore';
import { Colors, Radius, Spacing, FontSize } from '@/constants/theme';
import { BookingStatusLabels, BookingStatusColors } from '@/constants/BookingStatuses';
import { ServiceDisplayNames, type ServiceCategory } from '@/constants/ServiceCategories';
import type { Booking } from '@/types/booking';

const ACTIVE_STATUSES = [
  'pending',
  'confirmed',
  'provider_assigned',
  'family_notified',
  'en_route',
  'arrived',
  'in_progress',
] as const;

function isActive(status: string): boolean {
  return ACTIVE_STATUSES.includes(status as (typeof ACTIVE_STATUSES)[number]);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  const time = `${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  if (isToday) return `Today, ${time}`;
  if (isTomorrow) return `Tomorrow, ${time}`;
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}, ${time}`;
}

function priceStr(pkr: number): string {
  return `PKR ${pkr.toLocaleString()}`;
}

// ─── Booking Card ────────────────────────────────────────────────────────────

interface BookingCardProps {
  booking: Booking;
  theme: ReturnType<typeof useTheme>;
  onPress: () => void;
}

function BookingCard({ booking, theme, onPress }: BookingCardProps) {
  const statusColor = BookingStatusColors[booking.status];
  const isCancelledOrDisputed = booking.status === 'cancelled' || booking.status === 'disputed';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.border,
          shadowColor: theme.colors.primary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 8,
          elevation: 2,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Top row: ID + status badge */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={[styles.idDot, { backgroundColor: statusColor }]} />
          <Text
            style={[
              styles.bookingId,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.medium },
            ]}
          >
            {booking.booking_id}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text
            style={[
              styles.statusText,
              {
                color: statusColor,
                fontFamily: theme.fontFamily.semiBold,
              },
            ]}
          >
            {BookingStatusLabels[booking.status]}
          </Text>
        </View>
      </View>

      {/* Services */}
      <View style={styles.serviceRow}>
        {booking.service_bundle.map((svc) => (
          <View
            key={svc}
            style={[
              styles.serviceChip,
              {
                backgroundColor: theme.colors.primary + '10',
                borderColor: theme.colors.primary + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.serviceChipText,
                { color: theme.colors.primary, fontFamily: theme.fontFamily.medium },
              ]}
            >
              {ServiceDisplayNames[svc as ServiceCategory] ?? svc}
            </Text>
          </View>
        ))}
      </View>

      {/* Bottom row: date + price + arrow */}
      <View style={styles.cardFooter}>
        <View style={styles.footerLeft}>
          <Ionicons name="calendar-outline" size={14} color={theme.colors.textMuted} />
          <Text
            style={[
              styles.dateText,
              { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {formatDate(booking.scheduled_start)}
          </Text>
        </View>

        <View style={styles.footerRight}>
          {!isCancelledOrDisputed && (
            <Text
              style={[
                styles.priceText,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {priceStr(booking.quoted_price)}
            </Text>
          )}
          {booking.compensation_discount != null && booking.compensation_discount > 0 && (
            <View style={[styles.compBadge, { backgroundColor: Colors.accent + '18' }]}>
              <Text
                style={[
                  styles.compText,
                  { color: Colors.accent, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                PKR {booking.compensation_discount} off
              </Text>
            </View>
          )}
          <View style={[styles.arrowCircle, { backgroundColor: theme.colors.surfaceElevated }]}>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textSecondary} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Tab = 'active' | 'past';

export default function BookingsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const setBooking = useBookingStore((s) => s.setBooking);
  const bookings = useBookingStore((s) => s.bookings);
  const [tab, setTab] = useState<Tab>('active');

  const { activeBookings, pastBookings } = useMemo(() => {
    const active: Booking[] = [];
    const past: Booking[] = [];
    for (const b of bookings) {
      if (isActive(b.status)) active.push(b);
      else past.push(b);
    }
    return { activeBookings: active, pastBookings: past };
  }, [bookings]);

  const displayed = tab === 'active' ? activeBookings : pastBookings;

  const handlePress = (booking: Booking) => {
    setBooking(booking, null, null);

    if (booking.status === 'cancelled' || booking.status === 'disputed') {
      router.push({
        pathname: '/modals/dispute',
        params: { bookingId: booking.booking_id, providerId: booking.provider_id },
      });
    } else {
      router.push('/request/status');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          My Bookings
        </Text>
        {activeBookings.length > 0 && (
          <View style={[styles.activeCount, { backgroundColor: Colors.primary + '15' }]}>
            <Text
              style={[
                styles.activeCountText,
                { color: Colors.primary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              {activeBookings.length} active
            </Text>
          </View>
        )}
      </View>

      {/* Segmented tab */}
      <View style={styles.segmentRow}>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            tab === 'active' && {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 3,
            },
          ]}
          onPress={() => setTab('active')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentLabel,
              {
                color: tab === 'active' ? '#fff' : theme.colors.textSecondary,
                fontFamily: theme.fontFamily.semiBold,
              },
            ]}
          >
            Active
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.segmentBtn,
            tab === 'past' && {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.2,
              shadowRadius: 6,
              elevation: 3,
            },
          ]}
          onPress={() => setTab('past')}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.segmentLabel,
              {
                color: tab === 'past' ? '#fff' : theme.colors.textSecondary,
                fontFamily: theme.fontFamily.semiBold,
              },
            ]}
          >
            Past
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayed.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBox, { backgroundColor: theme.colors.primary + '10' }]}>
              <Ionicons
                name={tab === 'active' ? 'calendar-outline' : 'archive-outline'}
                size={48}
                color={theme.colors.primary + '60'}
              />
            </View>
            <Text
              style={[
                styles.emptyTitle,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {tab === 'active' ? 'No active bookings' : 'No past bookings'}
            </Text>
            <Text
              style={[
                styles.emptySub,
                { color: theme.colors.textMuted, fontFamily: theme.fontFamily.regular },
              ]}
            >
              {tab === 'active'
                ? 'Create a new request from the Home tab to get started.'
                : 'Your completed and cancelled bookings will appear here.'}
            </Text>
          </View>
        ) : (
          <View style={styles.cardList}>
            {displayed.map((booking) => (
              <BookingCard
                key={booking.booking_id}
                booking={booking}
                theme={theme}
                onPress={() => handlePress(booking)}
              />
            ))}
          </View>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: FontSize.xxl },
  activeCount: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  activeCountText: { fontSize: FontSize.xs },

  segmentRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: { fontSize: FontSize.sm },

  scrollContent: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingBottom: 104 },
  cardList: { gap: 12 },

  // ── Card ──
  card: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  idDot: { width: 8, height: 8, borderRadius: 4 },
  bookingId: { fontSize: FontSize.sm },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.xs },

  serviceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  serviceChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  serviceChipText: { fontSize: FontSize.xs },

  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dateText: { fontSize: FontSize.xs },
  footerRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceText: { fontSize: FontSize.base },
  compBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  compText: { fontSize: FontSize.xs },
  arrowCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Empty ──
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyIconBox: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: { fontSize: FontSize.xl, marginBottom: 8 },
  emptySub: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
