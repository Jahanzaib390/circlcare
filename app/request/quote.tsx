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
import { Colors } from '@/constants/theme';
import type { PricingBreakdown, QuoteLineItem } from '@/types/pricing';

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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
              Calculating transparent pricing...
            </Text>
          </View>
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
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000015',
    backgroundColor: '#00000005',
  },
  cardTitle: { fontSize: 16 },
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
