import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useBookingStore } from '@/hooks/useBookingStore';
import { useMatchStore } from '@/hooks/useMatchStore';
import { useRequestStore } from '@/hooks/useRequestStore';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/theme';

export default function ConfirmScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { booking } = useBookingStore();
  const { selectedMatch } = useMatchStore();
  const { parsedRequest } = useRequestStore();

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Play success animations on mount
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, slideAnim]);

  if (!booking || !selectedMatch || !parsedRequest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.textPrimary }}>No active booking found.</Text>
          <Button label="Go Home" onPress={() => router.replace('/')} style={{ marginTop: 16 }} />
        </View>
      </SafeAreaView>
    );
  }

  const handleTrackStatus = () => {
    router.replace('/request/status');
  };

  const formattedDate = new Date(booking.scheduled_start).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── Success Graphic ── */}
      <View style={styles.graphicContainer}>
        <Animated.View
          style={[
            styles.successCircle,
            {
              backgroundColor: Colors.accent + '20',
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <View style={[styles.successInner, { backgroundColor: Colors.accent }]}>
            <Ionicons name="checkmark-sharp" size={48} color="#fff" style={{ marginTop: 4 }} />
          </View>
        </Animated.View>

        <Animated.Text
          style={[
            styles.successTitle,
            {
              color: theme.colors.textPrimary,
              fontFamily: theme.fontFamily.bold,
              opacity: opacityAnim,
            },
          ]}
        >
          Booking Confirmed!
        </Animated.Text>

        <Animated.Text
          style={[
            styles.successSubtitle,
            {
              color: theme.colors.textSecondary,
              fontFamily: theme.fontFamily.regular,
              opacity: opacityAnim,
            },
          ]}
        >
          Your provider is scheduled and ready.
        </Animated.Text>
      </View>

      {/* ── Booking Summary Card ── */}
      <Animated.View
        style={[
          styles.summaryCard,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <Text
            style={[
              styles.cardTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Booking ID: #{booking.booking_id.split('-')[0].toUpperCase()}
          </Text>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <Ionicons name="person-outline" size={18} color={theme.colors.textMuted} />
            <Text style={[styles.detailText, { color: theme.colors.textPrimary }]}>
              {selectedMatch.provider.name}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="medical-outline" size={18} color={theme.colors.textMuted} />
            <Text
              style={[
                styles.detailText,
                { color: theme.colors.textPrimary, textTransform: 'capitalize' },
              ]}
            >
              {booking.service_bundle.join(', ').replace(/_/g, ' ')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={18} color={theme.colors.textMuted} />
            <Text style={[styles.detailText, { color: theme.colors.textPrimary }]}>
              {formattedDate}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={18} color={theme.colors.textMuted} />
            <Text
              style={[styles.detailText, { color: theme.colors.textPrimary }]}
              numberOfLines={1}
            >
              {booking.location_from}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: theme.colors.textSecondary }]}>
              Total Paid
            </Text>
            <Text
              style={[
                styles.totalAmount,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
              ]}
            >
              {booking.quoted_price.toLocaleString()} PKR
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* ── Family Notified Pill ── */}
      <Animated.View
        style={[
          styles.familyPill,
          {
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <View style={[styles.iconBox, { backgroundColor: Colors.accent + '20' }]}>
          <Ionicons name="people" size={16} color={Colors.accent} />
        </View>
        <View style={styles.familyPillText}>
          <Text
            style={[
              styles.familyTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Family Group Notified
          </Text>
          <Text style={[styles.familySub, { color: theme.colors.textSecondary }]}>
            An SMS has been sent to your primary contacts.
          </Text>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={Colors.accent} />
      </Animated.View>

      <View style={{ flex: 1 }} />

      {/* ── Actions ── */}
      <Animated.View
        style={[
          styles.actions,
          {
            opacity: opacityAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Button
          label="Track Provider Status"
          variant="primary"
          size="lg"
          fullWidth
          onPress={handleTrackStatus}
          style={{ marginBottom: 12 }}
        />
        <Button
          label="Return to Home"
          variant="ghost"
          size="md"
          fullWidth
          onPress={() => router.replace('/')}
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  graphicContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 24,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 15,
  },

  summaryCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardHeader: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000015',
    backgroundColor: '#00000005',
  },
  cardTitle: { fontSize: 14 },
  cardBody: { padding: 16, gap: 12 },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailText: { fontSize: 15, flex: 1 },

  divider: { height: StyleSheet.hairlineWidth, marginVertical: 4 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: { fontSize: 15 },
  totalAmount: { fontSize: 18 },

  familyPill: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyPillText: { flex: 1 },
  familyTitle: { fontSize: 14, marginBottom: 2 },
  familySub: { fontSize: 12 },

  actions: {
    padding: 16,
    paddingBottom: 32,
  },
});
