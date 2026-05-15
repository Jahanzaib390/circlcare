/**
 * status.tsx — Phase 4.1 Booking Timeline & Live Status Screen
 * Animated 9-step vertical timeline with 5-second polling and demo simulation.
 */

import React, { useEffect, useRef, useCallback } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useBookingStore } from '@/hooks/useBookingStore';
import { useBookingStatus } from '@/hooks/useBookingStatus';
import { useBooking } from '@/hooks/useBooking';
import { Button } from '@/components/ui/Button';
import { Colors, Shadows, Radius, FontSize, Spacing } from '@/constants/theme';
import {
  BOOKING_TIMELINE_STEPS,
  BookingStatus,
  BookingStatusLabels,
  BookingStatusColors,
} from '@/constants/BookingStatuses';
import type { BookingTimelineEvent } from '@/types/booking';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Step icon helpers ────────────────────────────────────────────────────────

const STEP_ICONS: Record<BookingStatus, IoniconName> = {
  pending: 'time-outline',
  confirmed: 'checkmark-circle-outline',
  provider_assigned: 'person-add-outline',
  family_notified: 'people-outline',
  en_route: 'car-outline',
  arrived: 'location-outline',
  in_progress: 'pulse-outline',
  completed: 'checkmark-done-circle-outline',
  proof_uploaded: 'camera-outline',
  feedback_collected: 'star-outline',
  cancelled: 'close-circle-outline',
  disputed: 'warning-outline',
};

const TERMINAL_STATUSES: BookingStatus[] = [
  'completed',
  'proof_uploaded',
  'feedback_collected',
  'cancelled',
  'disputed',
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StepItemProps {
  step: BookingStatus;
  stepIndex: number;
  currentIndex: number;
  event: BookingTimelineEvent | undefined;
  isLast: boolean;
  theme: ReturnType<typeof useTheme>;
}

function StepItem({ step, stepIndex, currentIndex, event, isLast, theme }: StepItemProps) {
  const isDone = stepIndex < currentIndex;
  const isActive = stepIndex === currentIndex;
  const isPending = stepIndex > currentIndex;

  const scaleAnim = useRef(new Animated.Value(isDone ? 1 : 0.7)).current;
  const opacityAnim = useRef(new Animated.Value(isDone ? 1 : isPending ? 0.35 : 1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Animate when step becomes active or done
  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 700, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim]);

  useEffect(() => {
    if (isDone) {
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 6, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
      ]).start();
    } else if (isPending) {
      Animated.timing(opacityAnim, { toValue: 0.35, duration: 200, useNativeDriver: true }).start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone, isPending]);

  const iconColor = isDone ? Colors.accent : isActive ? Colors.primary : theme.colors.textMuted;

  const dotBg = isDone
    ? Colors.accent + '20'
    : isActive
      ? Colors.primary + '20'
      : theme.colors.border + '60';

  const formattedTime = event
    ? new Date(event.timestamp).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <Animated.View style={[styles.stepRow, { opacity: opacityAnim }]}>
      {/* Connector line */}
      <View style={styles.stepLeft}>
        <Animated.View
          style={[
            styles.stepDot,
            { backgroundColor: dotBg, transform: [{ scale: isActive ? pulseAnim : scaleAnim }] },
          ]}
        >
          <Ionicons name={isDone ? 'checkmark' : STEP_ICONS[step]} size={16} color={iconColor} />
        </Animated.View>
        {!isLast && (
          <View
            style={[
              styles.connector,
              { backgroundColor: isDone ? Colors.accent + '50' : theme.colors.border },
            ]}
          />
        )}
      </View>

      {/* Step content */}
      <View style={styles.stepContent}>
        <View style={styles.stepHeader}>
          <Text
            style={[
              styles.stepLabel,
              {
                color: isDone || isActive ? theme.colors.textPrimary : theme.colors.textMuted,
                fontFamily: isActive ? theme.fontFamily.semiBold : theme.fontFamily.regular,
              },
            ]}
          >
            {BookingStatusLabels[step]}
          </Text>
          {formattedTime && (
            <Text style={[styles.stepTime, { color: theme.colors.textMuted }]}>
              {formattedTime}
            </Text>
          )}
        </View>
        {event?.note && (
          <Text style={[styles.stepNote, { color: theme.colors.textSecondary }]}>{event.note}</Text>
        )}
        {isActive && !event?.note && (
          <Text style={[styles.stepNote, { color: Colors.primary }]}>In progress…</Text>
        )}
      </View>
    </Animated.View>
  );
}

// ─── Status Banner ────────────────────────────────────────────────────────────

interface StatusBannerProps {
  status: BookingStatus;
  etaMinutes?: number;
  theme: ReturnType<typeof useTheme>;
}

function StatusBanner({ status, etaMinutes, theme }: StatusBannerProps) {
  const bannerColor = BookingStatusColors[status] ?? Colors.primary;
  const isCancelled = status === 'cancelled' || status === 'disputed';
  const isEnRoute = status === 'en_route';

  const dotAnim = useRef(new Animated.Value(0.4)).current;
  useEffect(() => {
    if (isEnRoute) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(dotAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(dotAnim, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [isEnRoute, dotAnim]);

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: isCancelled ? Colors.danger + '12' : bannerColor + '12',
          borderColor: isCancelled ? Colors.danger + '30' : bannerColor + '30',
        },
      ]}
    >
      {/* Live dot for en_route */}
      {isEnRoute && (
        <Animated.View
          style={[styles.liveDot, { backgroundColor: Colors.accent, opacity: dotAnim }]}
        />
      )}
      <View style={styles.bannerIcon}>
        <Ionicons
          name={STEP_ICONS[status] ?? 'radio-button-on-outline'}
          size={20}
          color={isCancelled ? Colors.danger : bannerColor}
        />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.bannerStatus,
            {
              color: isCancelled ? Colors.danger : bannerColor,
              fontFamily: theme.fontFamily.semiBold,
            },
          ]}
        >
          {BookingStatusLabels[status]}
        </Text>
        {isEnRoute && etaMinutes && (
          <Text style={[styles.bannerSub, { color: theme.colors.textSecondary }]}>
            Provider en route · {etaMinutes} min away
          </Text>
        )}
        {isCancelled && (
          <Text style={[styles.bannerSub, { color: Colors.danger }]}>
            This booking has been cancelled
          </Text>
        )}
      </View>
    </View>
  );
}

// ─── Map Placeholder ──────────────────────────────────────────────────────────

interface MapPlaceholderProps {
  etaMinutes?: number;
  theme: ReturnType<typeof useTheme>;
}

function MapPlaceholder({ etaMinutes, theme }: MapPlaceholderProps) {
  const providerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(providerAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(providerAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [providerAnim]);

  const translateX = providerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 15],
  });

  return (
    <View
      style={[
        styles.mapBox,
        { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      ]}
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((pct) => (
        <View
          key={`h-${pct}`}
          style={[
            styles.mapGridLine,
            { top: `${pct * 100}%` as `${number}%`, backgroundColor: theme.colors.border },
          ]}
        />
      ))}
      {[0.3, 0.6].map((pct) => (
        <View
          key={`v-${pct}`}
          style={[
            styles.mapGridLineV,
            { left: `${pct * 100}%` as `${number}%`, backgroundColor: theme.colors.border },
          ]}
        />
      ))}

      {/* Destination pin */}
      <View style={[styles.destinationPin, { backgroundColor: Colors.danger }]}>
        <Ionicons name="home" size={10} color="#fff" />
      </View>

      {/* Moving provider dot */}
      <Animated.View
        style={[
          styles.providerDot,
          { backgroundColor: Colors.primary, transform: [{ translateX }] },
        ]}
      />

      {/* Route line (static visual) */}
      <View style={[styles.routeLine, { backgroundColor: Colors.primary + '40' }]} />

      {/* ETA chip */}
      {etaMinutes && (
        <View style={[styles.etaChip, { backgroundColor: Colors.primary }]}>
          <Text style={styles.etaChipText}>{etaMinutes} min</Text>
        </View>
      )}

      {/* Map label */}
      <View style={[styles.mapLabel, { backgroundColor: theme.colors.surface + 'CC' }]}>
        <Ionicons name="map-outline" size={11} color={theme.colors.textMuted} />
        <Text style={[styles.mapLabelText, { color: theme.colors.textMuted }]}>
          Live map (demo)
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function StatusScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { booking } = useBookingStore();
  const { mutate: createBooking, isPending: isBookingReplacement } = useBooking();

  const bookingId = booking?.booking_id ?? null;

  const {
    status,
    timeline,
    provider_eta_minutes,
    family_notified,
    delay_reason,
    cancellation_reason,
    compensation_discount,
    replacements,
    isLoading,
    error,
    isSimulating,
    simulateNextStep,
  } = useBookingStatus(bookingId);

  const headerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(headerAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [headerAnim]);

  // Build timeline event map for quick lookup
  const timelineMap = React.useMemo(() => {
    const map: Record<string, BookingTimelineEvent> = {};
    for (const ev of timeline) {
      map[ev.status] = ev;
    }
    return map;
  }, [timeline]);

  const currentIndex = React.useMemo(() => {
    if (!status) return -1;
    const directIndex = BOOKING_TIMELINE_STEPS.indexOf(status);
    if (directIndex >= 0) return directIndex;

    return timeline.reduce((latest, ev) => {
      const idx = BOOKING_TIMELINE_STEPS.indexOf(ev.status);
      return idx > latest ? idx : latest;
    }, -1);
  }, [status, timeline]);
  const isCancelled = status === 'cancelled' || status === 'disputed';
  const isCompleted =
    status === 'completed' || status === 'proof_uploaded' || status === 'feedback_collected';
  const isEnRoute = status === 'en_route';
  const isTerminal = status ? TERMINAL_STATUSES.includes(status) : false;
  const canRunTransitEdgeCases = isEnRoute && !isTerminal;

  const handleBookReplacement = useCallback(
    (replacementIndex: number) => {
      const replacement = replacements?.[replacementIndex];
      if (!booking?.original_request || !replacement) return;

      createBooking(
        {
          request: booking.original_request,
          provider: replacement.match.provider,
          pricing: replacement.quote,
        },
        {
          onSuccess: () => router.replace('/request/confirm'),
        }
      );
    },
    [booking?.original_request, createBooking, replacements, router]
  );

  const formattedDate = booking?.scheduled_start
    ? new Date(booking.scheduled_start).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      })
    : '';

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }, [router]);

  // ── No booking fallback ──
  if (!bookingId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <Ionicons name="calendar-outline" size={48} color={theme.colors.textMuted} />
          <Text
            style={[
              styles.emptyTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            No Active Booking
          </Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            Complete a booking first to track its status.
          </Text>
          <Button label="Go Home" onPress={() => router.replace('/')} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── Header ── */}
      <Animated.View
        style={[styles.header, { borderBottomColor: theme.colors.border, opacity: headerAnim }]}
      >
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={22} color={theme.colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.headerTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
            ]}
          >
            Booking Status
          </Text>
          {booking && (
            <Text style={[styles.headerSub, { color: theme.colors.textMuted }]}>
              #{booking.booking_id.split('-')[0].toUpperCase()} · {formattedDate}
            </Text>
          )}
        </View>
        {isLoading && <ActivityIndicator size="small" color={Colors.primary} />}
      </Animated.View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Status Banner ── */}
        {status && <StatusBanner status={status} etaMinutes={provider_eta_minutes} theme={theme} />}

        {/* ── Map Placeholder (shown when en_route) ── */}
        {isEnRoute && <MapPlaceholder etaMinutes={provider_eta_minutes} theme={theme} />}

        {/* ── Family Notified pill ── */}
        {family_notified && (
          <View
            style={[
              styles.familyPill,
              { backgroundColor: Colors.accent + '15', borderColor: Colors.accent + '30' },
            ]}
          >
            <Ionicons name="people" size={15} color={Colors.accent} />
            <Text
              style={[
                styles.familyPillText,
                { color: Colors.accent, fontFamily: theme.fontFamily.medium },
              ]}
            >
              Family group notified
            </Text>
          </View>
        )}

        {/* ── Delay card ── */}
        {delay_reason && !isCancelled && (
          <View
            style={[
              styles.delayCard,
              { backgroundColor: Colors.warning + '10', borderColor: Colors.warning + '30' },
            ]}
          >
            <Ionicons name="time-outline" size={18} color={Colors.warning} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.delayTitle,
                  { color: Colors.warning, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                Provider Delayed
              </Text>
              <Text style={[styles.delayReason, { color: theme.colors.textSecondary }]}>
                {delay_reason}
              </Text>
            </View>
          </View>
        )}

        {/* ── Cancellation card ── */}
        {isCancelled && cancellation_reason && (
          <View
            style={[
              styles.cancelCard,
              { backgroundColor: Colors.danger + '10', borderColor: Colors.danger + '30' },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={18} color={Colors.danger} />
            <View style={{ flex: 1 }}>
              <Text
                style={[
                  styles.cancelTitle,
                  { color: Colors.danger, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                Booking Cancelled
              </Text>
              <Text style={[styles.cancelReason, { color: theme.colors.textSecondary }]}>
                {cancellation_reason}
              </Text>
              {compensation_discount && (
                <Text style={[styles.cancelReason, { color: Colors.accent, marginTop: 4 }]}>
                  Compensation credit: {compensation_discount.toLocaleString()} PKR applied
                </Text>
              )}
            </View>
          </View>
        )}

        {isCancelled && replacements && replacements.length > 0 && (
          <View
            style={[
              styles.replacementCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.demoHeader}>
              <Ionicons name="refresh-circle-outline" size={18} color={Colors.primary} />
              <Text
                style={[
                  styles.demoLabel,
                  { color: Colors.primary, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                Replacement Options
              </Text>
            </View>
            <Text style={[styles.demoDesc, { color: theme.colors.textSecondary }]}>
              Family has been notified. These providers exclude the cancelled provider and include
              the compensation credit in the quote.
            </Text>
            {replacements.slice(0, 2).map((replacement, index) => (
              <View
                key={replacement.match.provider.id}
                style={[styles.replacementRow, { borderColor: theme.colors.border }]}
              >
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.replacementName,
                      { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
                    ]}
                  >
                    {replacement.match.provider.name}
                  </Text>
                  <Text style={[styles.replacementMeta, { color: theme.colors.textSecondary }]}>
                    {Math.round(replacement.match.score.total * 100)}% match ·{' '}
                    {replacement.quote.total.toLocaleString()} PKR after credit
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.replacementBtn, { backgroundColor: Colors.primary }]}
                  onPress={() => handleBookReplacement(index)}
                  disabled={isBookingReplacement}
                >
                  <Text style={styles.replacementBtnText}>Book</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── Timeline Card ── */}
        <View
          style={[
            styles.timelineCard,
            { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            Shadows.md,
          ]}
        >
          <Text
            style={[
              styles.timelineTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Live Timeline
          </Text>

          {error && (
            <View style={styles.errorRow}>
              <Ionicons name="wifi-outline" size={14} color={Colors.warning} />
              <Text style={[styles.errorText, { color: Colors.warning }]}>
                Polling paused — {error}
              </Text>
            </View>
          )}

          <View style={styles.stepsContainer}>
            {BOOKING_TIMELINE_STEPS.map((step, idx) => (
              <StepItem
                key={step}
                step={step}
                stepIndex={idx}
                currentIndex={currentIndex}
                event={timelineMap[step]}
                isLast={idx === BOOKING_TIMELINE_STEPS.length - 1}
                theme={theme}
              />
            ))}
          </View>
        </View>

        {/* ── Demo: Simulate button ── */}
        {!isTerminal && (
          <View
            style={[
              styles.demoCard,
              { backgroundColor: Colors.primary + '08', borderColor: Colors.primary + '20' },
            ]}
          >
            <View style={styles.demoHeader}>
              <Ionicons name="flask-outline" size={16} color={Colors.primary} />
              <Text
                style={[
                  styles.demoLabel,
                  { color: Colors.primary, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                Demo Mode
              </Text>
            </View>
            <Text style={[styles.demoDesc, { color: theme.colors.textSecondary }]}>
              Advance the booking by one lifecycle step to see the timeline update in real time.
            </Text>
            <TouchableOpacity
              style={[
                styles.simulateBtn,
                {
                  backgroundColor: isSimulating ? Colors.primary + '60' : Colors.primary,
                  opacity: isSimulating ? 0.8 : 1,
                },
              ]}
              onPress={() => simulateNextStep()}
              disabled={isSimulating}
            >
              {isSimulating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="play-forward-outline" size={16} color="#fff" />
                  <Text style={styles.simulateBtnText}>Simulate Next Step</Text>
                </>
              )}
            </TouchableOpacity>
            {canRunTransitEdgeCases && (
              <View style={styles.edgeButtons}>
                <TouchableOpacity
                  style={[styles.edgeBtn, { borderColor: Colors.warning + '50' }]}
                  onPress={() => simulateNextStep('delay')}
                  disabled={isSimulating}
                >
                  <Ionicons name="time-outline" size={15} color={Colors.warning} />
                  <Text style={[styles.edgeBtnText, { color: Colors.warning }]}>Delay</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.edgeBtn, { borderColor: Colors.danger + '50' }]}
                  onPress={() => simulateNextStep('cancel')}
                  disabled={isSimulating}
                >
                  <Ionicons name="close-circle-outline" size={15} color={Colors.danger} />
                  <Text style={[styles.edgeBtnText, { color: Colors.danger }]}>
                    Cancel Mid-Transit
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── Leave Feedback CTA ── */}
        {isCompleted && (
          <View style={styles.feedbackSection}>
            <Button
              label="Leave Feedback"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => router.push('/request/feedback')}
            />
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: FontSize.lg },
  headerSub: { fontSize: FontSize.xs, marginTop: 2 },

  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm },

  // Banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: 4,
  },
  bannerIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  bannerStatus: { fontSize: FontSize.base },
  bannerSub: { fontSize: FontSize.sm, marginTop: 2 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 10,
    right: 10,
  },

  // Map
  mapBox: {
    height: 160,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
    position: 'relative',
  },
  mapGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  mapGridLineV: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: StyleSheet.hairlineWidth,
  },
  destinationPin: {
    position: 'absolute',
    right: '25%',
    top: '35%',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerDot: {
    position: 'absolute',
    left: '32%',
    top: '55%',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#fff',
  },
  routeLine: {
    position: 'absolute',
    left: '35%',
    top: '62%',
    width: '30%',
    height: 2,
    borderRadius: 1,
    transform: [{ rotate: '-15deg' }],
  },
  etaChip: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  etaChipText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },
  mapLabel: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  mapLabelText: { fontSize: 10 },

  // Family pill
  familyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  familyPillText: { fontSize: FontSize.sm },

  // Delay / cancellation cards
  delayCard: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  delayTitle: { fontSize: FontSize.sm, marginBottom: 3 },
  delayReason: { fontSize: FontSize.sm },
  cancelCard: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  cancelTitle: { fontSize: FontSize.sm, marginBottom: 3 },
  cancelReason: { fontSize: FontSize.sm },
  replacementCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 10,
  },
  replacementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  replacementName: { fontSize: FontSize.sm },
  replacementMeta: { fontSize: FontSize.xs, marginTop: 2 },
  replacementBtn: {
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  replacementBtnText: { color: '#fff', fontSize: FontSize.xs, fontWeight: '700' },

  // Timeline card
  timelineCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  timelineTitle: { fontSize: FontSize.base, marginBottom: Spacing.md },
  stepsContainer: { gap: 0 },

  // Step
  stepRow: {
    flexDirection: 'row',
    gap: 14,
    minHeight: 56,
  },
  stepLeft: {
    alignItems: 'center',
    width: 32,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  connector: {
    width: 2,
    flex: 1,
    marginVertical: 2,
    borderRadius: 1,
  },
  stepContent: {
    flex: 1,
    paddingTop: 6,
    paddingBottom: 20,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stepLabel: { fontSize: FontSize.sm, flex: 1 },
  stepTime: { fontSize: FontSize.xs },
  stepNote: { fontSize: FontSize.xs, marginTop: 3 },

  // Error
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  errorText: { fontSize: FontSize.xs },

  // Demo card
  demoCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: 10,
  },
  demoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  demoLabel: { fontSize: FontSize.sm },
  demoDesc: { fontSize: FontSize.xs, lineHeight: 18 },
  simulateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.md,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  simulateBtnText: {
    color: '#fff',
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  edgeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  edgeBtn: {
    flex: 1,
    minHeight: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
  },
  edgeBtnText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },

  // Feedback
  feedbackSection: { paddingVertical: 8 },

  // Empty state
  emptyTitle: { fontSize: FontSize.xl, marginTop: 16, marginBottom: 8 },
  emptySubtitle: { fontSize: FontSize.base, textAlign: 'center' },
});
