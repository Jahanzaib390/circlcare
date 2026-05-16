import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useBookingStore } from '@/hooks/useBookingStore';
import { useMatchStore } from '@/hooks/useMatchStore';
import { useRequestStore } from '@/hooks/useRequestStore';
import { Button } from '@/components/ui/Button';
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay';
import { Colors } from '@/constants/theme';

export default function ConfirmScreen() {
  const theme = useTheme();
  const router = useRouter();

  const { booking } = useBookingStore();
  const { selectedMatch, matchResponse } = useMatchStore();
  const { parsedRequest } = useRequestStore();
  const [showCelebration, setShowCelebration] = useState(true);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const ringScale = useRef(new Animated.Value(0)).current;
  const orbFloat = useRef(new Animated.Value(0)).current;
  const confettiOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.spring(ringScale, {
          toValue: 1,
          tension: 40,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(confettiOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(confettiOpacity, {
        toValue: 0,
        duration: 300,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbFloat, { toValue: 1, duration: 4000, useNativeDriver: true }),
        Animated.timing(orbFloat, { toValue: 0, duration: 4000, useNativeDriver: true }),
      ])
    ).start();

    const celebrationTimer = setTimeout(() => setShowCelebration(false), 1500);
    return () => clearTimeout(celebrationTimer);
  }, [scaleAnim, opacityAnim, slideAnim, ringScale, confettiOpacity, orbFloat]);

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
  const backupMatch = matchResponse?.top_matches.find(
    (match) => match.provider.id !== selectedMatch.provider.id
  );

  const orbY = orbFloat.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* ── Decorative orbs ── */}
      <Animated.View
        style={[
          styles.bgOrb,
          { backgroundColor: Colors.accent + '08', transform: [{ translateY: orbY }] },
        ]}
      />
      <Animated.View style={[styles.bgOrb2, { backgroundColor: Colors.primary + '06' }]} />

      {/* ── Success Graphic ── */}
      <View style={styles.graphicContainer}>
        <Animated.View
          style={[
            styles.successCircle,
            {
              backgroundColor: Colors.accent + '15',
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <Animated.View
            style={[
              styles.outerRing,
              {
                borderColor: Colors.accent + '30',
                transform: [{ scale: ringScale }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.outerRing2,
              {
                borderColor: Colors.accent + '18',
                transform: [
                  { scale: ringScale.interpolate({ inputRange: [0, 1], outputRange: [0, 1.3] }) },
                ],
              },
            ]}
          />
          <View style={[styles.successInner, { backgroundColor: Colors.accent }]}>
            <Ionicons name="checkmark-sharp" size={46} color="#fff" style={{ marginTop: 3 }} />
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
            Booking Summary
          </Text>
          <View style={[styles.idBadge, { backgroundColor: Colors.primary + '12' }]}>
            <Text
              style={[
                styles.idBadgeText,
                { color: Colors.primary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              #{booking.booking_id}
            </Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: Colors.primary + '10' }]}>
              <Ionicons name="person-outline" size={16} color={Colors.primary} />
            </View>
            <Text
              style={[
                styles.detailText,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.medium },
              ]}
              numberOfLines={1}
            >
              {selectedMatch.provider.name}
            </Text>
          </View>

          {backupMatch && (
            <View
              style={[
                styles.backupRow,
                { backgroundColor: Colors.accent + '10', borderColor: Colors.accent + '30' },
              ]}
            >
              <Ionicons name="git-branch-outline" size={16} color={Colors.accent} />
              <Text
                style={[
                  styles.backupText,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.medium },
                ]}
              >
                Backup ready: {backupMatch.provider.name} if plans change
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#EC4899' + '10' }]}>
              <Ionicons name="medical-outline" size={16} color="#EC4899" />
            </View>
            <Text
              style={[
                styles.detailText,
                {
                  color: theme.colors.textPrimary,
                  fontFamily: theme.fontFamily.medium,
                  textTransform: 'capitalize',
                },
              ]}
            >
              {booking.service_bundle.join(', ').replace(/_/g, ' ')}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#F59E0B' + '10' }]}>
              <Ionicons name="calendar-outline" size={16} color="#F59E0B" />
            </View>
            <Text
              style={[
                styles.detailText,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.medium },
              ]}
            >
              {formattedDate}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <View style={[styles.detailIcon, { backgroundColor: '#10B981' + '10' }]}>
              <Ionicons name="location-outline" size={16} color="#10B981" />
            </View>
            <Text
              style={[
                styles.detailText,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.medium },
              ]}
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
              PKR {booking.quoted_price.toLocaleString()}
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
        <View style={[styles.iconBox, { backgroundColor: Colors.accent + '15' }]}>
          <Ionicons name="people" size={18} color={Colors.accent} />
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

      <CelebrationOverlay visible={showCelebration} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  bgOrb: {
    position: 'absolute',
    top: -80,
    right: -80,
    width: 220,
    height: 220,
    borderRadius: 110,
  },
  bgOrb2: {
    position: 'absolute',
    bottom: '40%',
    left: -60,
    width: 160,
    height: 160,
    borderRadius: 80,
  },

  graphicContainer: {
    alignItems: 'center',
    paddingTop: 56,
    paddingBottom: 36,
  },
  successCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  outerRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  outerRing2: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  successInner: {
    width: 78,
    height: 78,
    borderRadius: 39,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  successTitle: { fontSize: 26, marginBottom: 6, letterSpacing: -0.3 },
  successSubtitle: { fontSize: 15, letterSpacing: 0.1 },

  summaryCard: {
    marginHorizontal: 20,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#00000010',
    backgroundColor: '#00000003',
  },
  cardTitle: { fontSize: 15 },
  idBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  idBadgeText: { fontSize: 12 },
  cardBody: { padding: 18, gap: 14 },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  detailIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: { fontSize: 15, flex: 1 },
  backupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  backupText: { flex: 1, fontSize: 13, lineHeight: 18 },

  divider: { height: StyleSheet.hairlineWidth, marginVertical: 2 },

  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  totalLabel: { fontSize: 15 },
  totalAmount: { fontSize: 20 },

  familyPill: {
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyPillText: { flex: 1 },
  familyTitle: { fontSize: 14, marginBottom: 2 },
  familySub: { fontSize: 12 },

  actions: {
    padding: 20,
    paddingBottom: 36,
  },
});
