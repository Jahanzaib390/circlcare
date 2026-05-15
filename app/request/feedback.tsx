import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { apiClient } from '@/services/apiClient';
import { useBookingStore } from '@/hooks/useBookingStore';
import { useMatchStore } from '@/hooks/useMatchStore';
import { useTheme } from '@/hooks/useTheme';
import type { ServiceCategory } from '@/constants/ServiceCategories';
import type { Provider } from '@/types/provider';

const COMPLAINT_REASONS = [
  { id: 'no_show', label: 'Provider No-show' },
  { id: 'late_arrival', label: 'Late Arrival' },
  { id: 'extra_charge', label: 'Extra Charge Requested' },
  { id: 'incomplete_service', label: 'Incomplete Service' },
  { id: 'safety_concern', label: 'Safety Concern' },
] as const;

const SERVICE_CHECKLISTS: Partial<Record<ServiceCategory, string[]>> = {
  clinic_visit: [
    'Reached the clinic safely',
    'Appointment support was completed',
    'Follow-up notes shared',
  ],
  home_nurse: [
    'Vitals or medication support completed',
    'Hygiene protocol followed',
    'Care notes shared',
  ],
  caregiver: ['Daily care tasks completed', 'Patient stayed comfortable', 'Professional conduct'],
  physiotherapy: [
    'Therapy session completed',
    'Exercises explained',
    'Pain or mobility notes shared',
  ],
  medicine_pickup: [
    'Correct medicines delivered',
    'Receipt shared',
    'Dosage instructions confirmed',
  ],
  lab_sample: [
    'Sample collected safely',
    'Receipt or tracking shared',
    'Hygiene protocol followed',
  ],
  meal_plan: ['Meal plan delivered', 'Diet preferences followed', 'Family instructions noted'],
  daily_support: ['Required tasks completed', 'Patient stayed comfortable', 'Professional conduct'],
  elder_companion: [
    'Companion visit completed',
    'Patient stayed comfortable',
    'Family update shared',
  ],
};

interface ReputationResponse {
  updated: boolean;
  provider: Provider;
}

export default function FeedbackScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { booking } = useBookingStore();
  const { selectedMatch } = useMatchStore();

  const checklistItems = useMemo(() => {
    const primaryService = booking?.service_bundle[0];
    return (
      (primaryService && SERVICE_CHECKLISTS[primaryService]) || [
        'Arrived on time',
        'Completed required tasks',
        'Professional conduct',
      ]
    );
  }, [booking?.service_bundle]);

  const [rating, setRating] = useState(0);
  const [confirmedTasks, setConfirmedTasks] = useState<boolean[]>(checklistItems.map(() => false));
  const [complaints, setComplaints] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setConfirmedTasks(checklistItems.map(() => false));
  }, [checklistItems]);

  const toggleComplaint = (id: string) => {
    setComplaints((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleTask = (index: number) => {
    setConfirmedTasks((prev) => prev.map((value, idx) => (idx === index ? !value : value)));
  };

  const handleUploadPlaceholder = () => {
    Alert.alert(
      'Upload placeholder',
      'Photo and receipt upload will be connected in the next build.'
    );
  };

  const handleSubmit = async () => {
    if (!booking || !selectedMatch) {
      Alert.alert('Booking missing', 'Complete a booking before submitting feedback.');
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient.post<ReputationResponse>(
        `/api/providers/${selectedMatch.provider.id}/reputation`,
        {
          rating,
          checklist: {
            arrived_on_time: confirmedTasks[0] ?? false,
            completed_tasks: confirmedTasks[1] ?? false,
            professional_conduct: confirmedTasks[2] ?? false,
          },
          complaint_reasons: complaints,
          booking_id: booking.booking_id,
        }
      );

      if (complaints.length > 0) {
        router.push({
          pathname: '/modals/dispute',
          params: {
            type: complaints[0],
            bookingId: booking.booking_id,
            providerId: selectedMatch.provider.id,
            description: COMPLAINT_REASONS.filter((reason) => complaints.includes(reason.id))
              .map((reason) => reason.label)
              .join(', '),
          },
        });
        return;
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Thank you', 'Your feedback helps keep CirclCare safe and reliable.', [
        { text: 'Done', onPress: () => router.navigate('/(tabs)') },
      ]);
    } catch (error) {
      console.warn('[FeedbackScreen] Reputation update failed:', error);
      Alert.alert(
        'Could not submit feedback',
        'Please check the backend connection and try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          How was the service?
        </Text>
        <Text
          style={[
            styles.subtitle,
            { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
          ]}
        >
          Your feedback updates the provider reputation.
        </Text>

        <Card style={styles.card}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Rate the Provider
          </Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)}>
                <Ionicons
                  name={star <= rating ? 'star' : 'star-outline'}
                  size={40}
                  color={star <= rating ? theme.colors.warning : theme.colors.border}
                  style={styles.star}
                />
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        <Card style={styles.card}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Service Checklist
          </Text>
          {checklistItems.map((task, idx) => (
            <TouchableOpacity
              key={task}
              style={styles.checklistItem}
              onPress={() => toggleTask(idx)}
            >
              <Feather
                name={confirmedTasks[idx] ? 'check-square' : 'square'}
                size={24}
                color={confirmedTasks[idx] ? theme.colors.primary : theme.colors.textSecondary}
              />
              <Text
                style={[
                  styles.checklistText,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {task}
              </Text>
            </TouchableOpacity>
          ))}
        </Card>

        <Card style={styles.card}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Photo / Receipt Proof
          </Text>
          <TouchableOpacity
            style={[styles.uploadBox, { borderColor: theme.colors.border, borderStyle: 'dashed' }]}
            onPress={handleUploadPlaceholder}
          >
            <Feather name="camera" size={32} color={theme.colors.textSecondary} />
            <Text
              style={{
                color: theme.colors.textSecondary,
                marginTop: 8,
                fontFamily: theme.fontFamily.medium,
              }}
            >
              Tap to upload
            </Text>
          </TouchableOpacity>
        </Card>

        <Card style={styles.card}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Report an Issue (Optional)
          </Text>
          <View style={styles.chipsRow}>
            {COMPLAINT_REASONS.map((reason) => (
              <Chip
                key={reason.id}
                label={reason.label}
                selected={complaints.includes(reason.id)}
                onPress={() => toggleComplaint(reason.id)}
              />
            ))}
          </View>
        </Card>

        <Button
          label={complaints.length > 0 ? 'Submit & File Dispute' : 'Submit Feedback'}
          onPress={handleSubmit}
          loading={isSubmitting}
          disabled={rating === 0 && complaints.length === 0}
          style={styles.submitBtn}
          variant={complaints.length > 0 ? 'danger' : 'primary'}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 24, paddingBottom: 60 },
  title: { fontSize: 28, marginBottom: 8 },
  subtitle: { fontSize: 16, marginBottom: 24 },
  card: { marginBottom: 16, padding: 20 },
  sectionTitle: { fontSize: 18, marginBottom: 16 },
  starsRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 8 },
  star: { marginHorizontal: 4 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  checklistText: { fontSize: 16, marginLeft: 12, flex: 1 },
  uploadBox: {
    borderWidth: 2,
    borderRadius: 12,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  submitBtn: { marginTop: 8 },
});
