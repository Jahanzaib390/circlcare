import React, { useEffect, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useRequestStore } from '@/hooks/useRequestStore';
import { useMatchStore } from '@/hooks/useMatchStore';
import { useQuote } from '@/hooks/useQuote';
import { useQuoteStore } from '@/hooks/useQuoteStore';
import { useBooking } from '@/hooks/useBooking';
import { Button } from '@/components/ui/Button';
import { CareAgentToast } from '@/components/ui/CareAgentToast';
import { Colors } from '@/constants/theme';
import type { PricingBreakdown, QuoteLineItem } from '@/types/pricing';
import type { ParsedRequest } from '@/types/request';

function LineItem({
  item,
  theme,
  animValue,
}: {
  item: QuoteLineItem;
  theme: ReturnType<typeof useTheme>;
  animValue: Animated.Value;
}) {
  const isDiscount = item.type === 'discount';
  const isFee = item.type === 'fee';

  const color = isDiscount ? Colors.accent : isFee ? Colors.warning : theme.colors.textPrimary;

  const opacity = animValue;
  const translateY = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 0],
  });

  return (
    <Animated.View style={[styles.lineItemRow, { opacity, transform: [{ translateY }] }]}>
      <Text style={[styles.lineItemLabel, { color: theme.colors.textSecondary }]}>
        {item.label}
      </Text>
      <Text
        style={[
          styles.lineItemAmount,
          {
            color,
            fontFamily: isDiscount || isFee ? theme.fontFamily.semiBold : theme.fontFamily.medium,
          },
        ]}
      >
        {isDiscount ? '' : item.amount > 0 ? '+' : ''}
        {item.amount.toLocaleString()} PKR
      </Text>
    </Animated.View>
  );
}

function formatRequestedSlot(request: ParsedRequest | null): string {
  if (!request) return 'Not specified';

  const scheduledDate = request.scheduled_datetime
    ? new Date(request.scheduled_datetime)
    : undefined;
  if (scheduledDate && !Number.isNaN(scheduledDate.getTime())) {
    return scheduledDate.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  const naturalSlot = resolveNaturalSlotLabel(request.time_preference);
  if (naturalSlot) return naturalSlot;

  const preference = request.time_preference?.trim();
  const hasUsefulPreference =
    preference &&
    !['not specified', 'flexible'].includes(preference.toLowerCase());

  if (hasUsefulPreference) return preference;
  return 'Not specified';
}

function resolveNaturalSlotLabel(timePreference?: string | null): string | undefined {
  const text = timePreference?.trim().toLowerCase();
  if (!text || ['not specified', 'flexible'].includes(text)) return undefined;

  const explicitClock = parseClockTime(text);
  let hour = explicitClock?.hour;
  let minute = explicitClock?.minute ?? 0;

  if (hour == null) {
    if (hasAny(text, ['early morning', 'subah jaldi', 'jaldi subah'])) hour = 8;
    else if (hasAny(text, ['morning', 'subah', 'savera'])) hour = 10;
    else if (hasAny(text, ['late afternoon', 'dopahar baad', 'dopehr baad'])) hour = 15;
    else if (hasAny(text, ['afternoon', 'dopahar', 'dopehr', 'dupehar'])) hour = 13;
    else if (hasAny(text, ['evening', 'shaam', 'sham'])) hour = 17;
    else if (hasAny(text, ['night', 'raat'])) hour = 20;
  }
  if (hour == null) return undefined;

  const date = new Date();
  if (hasAny(text, ['tomorrow', 'kal'])) {
    date.setDate(date.getDate() + 1);
  } else if (!hasAny(text, ['today', 'aaj'])) {
    date.setDate(date.getDate() + 1);
  }
  date.setHours(hour, minute, 0, 0);

  return date.toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function parseClockTime(text: string): { hour: number; minute: number } | undefined {
  const match = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b|\b(\d{1,2})\s*baje\b/);
  if (!match) return undefined;

  let hour = Number(match[1] ?? match[4]);
  const minute = Number(match[2] ?? '0');
  const suffix = match[3];

  if (suffix === 'pm' && hour < 12) hour += 12;
  if (suffix === 'am' && hour === 12) hour = 0;
  if (!suffix && hour >= 1 && hour <= 7 && hasAny(text, ['shaam', 'sham', 'evening', 'raat'])) {
    hour += 12;
  }

  if (hour > 23 || minute > 59) return undefined;
  return { hour, minute };
}

function hasAny(text: string, needles: string[]): boolean {
  return needles.some((needle) => text.includes(needle));
}

export default function QuoteScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { parsedRequest } = useRequestStore();
  const { selectedMatch } = useMatchStore();
  const { pricing, isAlternateSlotSelected, setAlternateSlotSelected } = useQuoteStore();

  const { mutate: getQuote, isPending: isQuotePending, isError: isQuoteError } = useQuote();
  const { mutate: createBooking, isPending: isBookingPending } = useBooking();

  const animValues = useRef<Animated.Value[]>([]).current;
  const totalAnim = useRef(new Animated.Value(0)).current;
  const didFetchQuoteRef = useRef(false);

  const effectivePricing = React.useMemo<PricingBreakdown | null>(() => {
    if (!pricing) return null;

    const suggestion = pricing.cheaper_slot_suggestion;
    if (!isAlternateSlotSelected || !suggestion) return pricing;

    const adjustedLineItems = pricing.line_items.filter((item) => {
      const label = item.label.toLowerCase();
      return !label.includes('surcharge') && !label.includes('priority dispatch');
    });

    return {
      ...pricing,
      line_items: [
        ...adjustedLineItems,
        {
          label: 'Alternate Slot Savings',
          amount: -suggestion.savings,
          type: 'discount',
        },
      ],
      subtotal: Math.max(0, pricing.subtotal - suggestion.savings),
      total: Math.max(0, pricing.total - suggestion.savings),
    };
  }, [isAlternateSlotSelected, pricing]);

  // Fetch quote on mount
  useEffect(() => {
    if (parsedRequest && selectedMatch && !didFetchQuoteRef.current) {
      didFetchQuoteRef.current = true;
      getQuote({ parsedRequest, provider: selectedMatch.provider });
    }
  }, [parsedRequest, selectedMatch, getQuote]);

  // Handle animation when pricing arrives
  useEffect(() => {
    if (pricing && pricing.line_items) {
      // Ensure we have enough animated values
      while (animValues.length < pricing.line_items.length) {
        animValues.push(new Animated.Value(0));
      }

      // Stagger animations
      const animations = pricing.line_items.map((_, i) =>
        Animated.timing(animValues[i], {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      );

      Animated.sequence([
        Animated.stagger(150, animations),
        Animated.timing(totalAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [pricing, animValues, totalAnim]);

  const handleBook = () => {
    if (!parsedRequest || !selectedMatch || !effectivePricing) return;

    const requestForBooking =
      isAlternateSlotSelected && pricing?.cheaper_slot_suggestion
        ? {
            ...parsedRequest,
            scheduled_datetime: pricing.cheaper_slot_suggestion.datetime,
            time_preference: 'Tomorrow morning',
            urgency: 'low' as const,
          }
        : parsedRequest;

    createBooking(
      {
        request: requestForBooking,
        provider: selectedMatch.provider,
        pricing: effectivePricing,
      },
      {
        onSuccess: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          router.replace('/request/confirm');
        },
      }
    );
  };

  if (!selectedMatch) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.textPrimary }}>No provider selected.</Text>
          <Button label="Go Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  const p = selectedMatch.provider;
  const pricingForDisplay = effectivePricing ?? pricing;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { borderBottomColor: theme.colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={theme.colors.textPrimary} />
        </Pressable>
        <Text
          style={[
            styles.topTitle,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          Review Quote
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* ── Provider Info ── */}
        <View style={styles.providerHeader}>
          <View style={[styles.providerAvatar, { backgroundColor: theme.colors.primary + '20' }]}>
            <Ionicons name="person" size={24} color={theme.colors.primary} />
          </View>
          <View>
            <Text
              style={[
                styles.providerName,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {p.name}
            </Text>
            <Text style={[styles.providerService, { color: theme.colors.textSecondary }]}>
              {parsedRequest?.service_bundle.map((s) => s.replace('_', ' ')).join(', ')}
            </Text>
          </View>
        </View>

        {/* ── Loading State ── */}
        {(isQuotePending || (!pricing && !isQuoteError)) && (
          <>
            <CareAgentToast
              messages={[
                'Reviewing quote for urgency and hidden charges...',
                'Checking whether a cheaper safe slot exists...',
                'Preparing a transparent care estimate...',
              ]}
            />
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
                Calculating transparent pricing...
              </Text>
            </View>
          </>
        )}

        {/* ── Error State ── */}
        {isQuoteError && (
          <View style={styles.loadingContainer}>
            <Ionicons name="warning-outline" size={32} color={Colors.danger} />
            <Text style={[styles.loadingText, { color: theme.colors.textPrimary }]}>
              Failed to load quote.
            </Text>
            <Button
              label="Retry"
              onPress={() => getQuote({ parsedRequest: parsedRequest!, provider: p })}
            />
          </View>
        )}

        {/* ── Visit Slot ── */}
        {pricingForDisplay && (
          <View
            style={[
              styles.card,
              styles.slotCard,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.slotRow}>
              <View style={[styles.slotIcon, { backgroundColor: theme.colors.primary + '12' }]}>
                <Ionicons name="time-outline" size={18} color={theme.colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.slotLabel, { color: theme.colors.textSecondary }]}>
                  Visit Slot
                </Text>
                <Text
                  style={[
                    styles.slotValue,
                    { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
                  ]}
                >
                  {formatRequestedSlot(
                    isAlternateSlotSelected && pricing?.cheaper_slot_suggestion
                      ? {
                          ...parsedRequest!,
                          scheduled_datetime: pricing.cheaper_slot_suggestion.datetime,
                          time_preference: 'Tomorrow morning',
                        }
                      : parsedRequest
                  )}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* ── Quote Breakdown ── */}
        {pricingForDisplay && (
          <View
            style={[
              styles.card,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                Pricing Breakdown
              </Text>
              <View style={styles.reviewBadge}>
                <Ionicons name="sparkles" size={12} color={Colors.accent} />
                <Text style={styles.reviewBadgeText}>Reviewed by care agent</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              {pricingForDisplay.line_items.map((item, index) => (
                <LineItem
                  key={`${item.label}-${index}`}
                  item={item}
                  theme={theme}
                  animValue={animValues[index] || new Animated.Value(0)}
                />
              ))}

              <Animated.View
                style={[
                  styles.totalRow,
                  { borderTopColor: theme.colors.border, opacity: totalAnim },
                ]}
              >
                <Text
                  style={[
                    styles.totalLabel,
                    { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
                  ]}
                >
                  Total Estimate
                </Text>
                <Text
                  style={[
                    styles.totalAmount,
                    { color: theme.colors.primary, fontFamily: theme.fontFamily.bold },
                  ]}
                >
                  {pricingForDisplay.total.toLocaleString()} PKR
                </Text>
              </Animated.View>
            </View>
          </View>
        )}

        {/* ── Cheaper Slot Suggestion ── */}
        {pricing?.cheaper_slot_suggestion && (
          <Animated.View style={{ opacity: totalAnim }}>
            <View
              style={[
                styles.banner,
                { backgroundColor: Colors.accent + '15', borderColor: Colors.accent + '40' },
              ]}
            >
              <View style={styles.bannerHeader}>
                <Ionicons name="leaf-outline" size={18} color={Colors.accent} />
                <Text
                  style={[
                    styles.bannerTitle,
                    { color: Colors.accent, fontFamily: theme.fontFamily.semiBold },
                  ]}
                >
                  Save {pricing.cheaper_slot_suggestion.savings.toLocaleString()} PKR
                </Text>
              </View>
              <Text style={[styles.bannerText, { color: theme.colors.textSecondary }]}>
                By booking tomorrow morning instead of requesting immediate emergency dispatch, you
                can avoid urgency and priority fees.
              </Text>
              <Pressable
                style={[
                  styles.bannerBtn,
                  {
                    backgroundColor: isAlternateSlotSelected ? Colors.accent : 'transparent',
                    borderColor: Colors.accent,
                  },
                ]}
                onPress={() => setAlternateSlotSelected(!isAlternateSlotSelected)}
              >
                <Text
                  style={[
                    styles.bannerBtnText,
                    { color: isAlternateSlotSelected ? '#fff' : Colors.accent },
                  ]}
                >
                  {isAlternateSlotSelected ? '✓ Selected Alternative Slot' : 'Select Cheaper Slot'}
                </Text>
              </Pressable>
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Bottom Actions ── */}
      {pricing && (
        <Animated.View
          style={[
            styles.bottomActions,
            { borderTopColor: theme.colors.border, opacity: totalAnim },
          ]}
        >
          <Button
            label={isAlternateSlotSelected ? 'Book Alternate Slot' : 'Confirm Booking'}
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleBook}
            loading={isBookingPending}
          />
          <Button
            label="Change Provider"
            variant="ghost"
            size="md"
            fullWidth
            onPress={() => router.back()}
            style={{ marginTop: 8 }}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 17 },

  content: { padding: 16, paddingBottom: 40 },

  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  providerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerName: { fontSize: 20, marginBottom: 2 },
  providerService: { fontSize: 14, textTransform: 'capitalize' },

  loadingContainer: { alignItems: 'center', paddingVertical: 40 },
  loadingText: { marginTop: 16, fontSize: 15 },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 24,
  },
  slotCard: {
    padding: 16,
    marginBottom: 12,
  },
  slotRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  slotIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotLabel: { fontSize: 13, marginBottom: 2 },
  slotValue: { fontSize: 16, textTransform: 'capitalize' },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000015',
    backgroundColor: '#00000005',
  },
  cardTitle: { fontSize: 16 },
  reviewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: Colors.accent + '12',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  reviewBadgeText: { color: Colors.accent, fontSize: 11, fontWeight: '700' },
  cardBody: { padding: 16 },

  lineItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  lineItemLabel: { fontSize: 14 },
  lineItemAmount: { fontSize: 14 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  totalLabel: { fontSize: 16 },
  totalAmount: { fontSize: 18 },

  banner: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  bannerHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  bannerTitle: { fontSize: 15 },
  bannerText: { fontSize: 13, lineHeight: 18, marginBottom: 16 },
  bannerBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  bannerBtnText: { fontSize: 14, fontWeight: '600' },

  bottomActions: {
    padding: 16,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
