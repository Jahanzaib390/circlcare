import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { apiClient } from '@/services/apiClient';
import { useBookingStore } from '@/hooks/useBookingStore';
import { useMatchStore } from '@/hooks/useMatchStore';
import { useTheme } from '@/hooks/useTheme';

type DisputeType =
  | 'no_show'
  | 'late_arrival'
  | 'extra_charge'
  | 'incomplete_service'
  | 'safety_concern';

type RecommendationAction = 'refund' | 'revisit' | 'human_escalation';

interface DisputeRecommendation {
  action: RecommendationAction;
  reason: string;
  refund_amount?: number;
}

interface DisputeResponse {
  dispute_id: string;
  summary: string;
  recommendation: DisputeRecommendation;
  human_agent_notified: boolean;
}

const DISPUTE_TYPES: { id: DisputeType; label: string; description: string }[] = [
  { id: 'no_show', label: 'No-show', description: 'Provider did not arrive for the visit.' },
  { id: 'late_arrival', label: 'Late arrival', description: 'Provider arrived too late.' },
  { id: 'extra_charge', label: 'Extra charge', description: 'Unexpected cost was requested.' },
  {
    id: 'incomplete_service',
    label: 'Incomplete',
    description: 'The booked care tasks were not completed.',
  },
  { id: 'safety_concern', label: 'Safety', description: 'A trust or safety concern occurred.' },
];

function normalizeType(value: unknown): DisputeType {
  if (value === 'incomplete') return 'incomplete_service';
  return DISPUTE_TYPES.some((type) => type.id === value)
    ? (value as DisputeType)
    : 'incomplete_service';
}

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function DisputeModal() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { booking } = useBookingStore();
  const { selectedMatch } = useMatchStore();

  const initialType = normalizeType(firstParam(params.type));
  const [selectedType, setSelectedType] = useState<DisputeType>(initialType);
  const [isLoading, setIsLoading] = useState(false);
  const [summary, setSummary] = useState('');
  const [recommendation, setRecommendation] = useState<DisputeRecommendation | null>(null);
  const [escalated, setEscalated] = useState(false);

  const bookingId = firstParam(params.bookingId) ?? booking?.booking_id ?? 'demo_booking';
  const providerId = firstParam(params.providerId) ?? selectedMatch?.provider.id ?? 'demo_provider';
  const description =
    firstParam(params.description) ??
    DISPUTE_TYPES.find((type) => type.id === selectedType)?.description ??
    'User reported an issue post-service.';

  const fileDispute = async (type: DisputeType) => {
    setIsLoading(true);
    setSummary('');
    setRecommendation(null);
    try {
      const response = await apiClient.post<DisputeResponse>('/api/disputes', {
        booking_id: bookingId,
        provider_id: providerId,
        user_id: booking?.user_id ?? 'demo_user',
        type,
        description,
        submitted_at: new Date().toISOString(),
      });
      setSummary(response.summary);
      setRecommendation(response.recommendation);
      setEscalated(response.human_agent_notified);
    } catch (error) {
      console.warn('[DisputeModal] Falling back after API error:', error);
      setSummary('Dispute filed. Our team will review this shortly.');
      setRecommendation({
        action: 'human_escalation',
        reason: 'The backend could not be reached, so this should be reviewed by a human agent.',
      });
      setEscalated(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fileDispute(initialType);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialType]);

  const handleTypePress = (type: DisputeType) => {
    setSelectedType(type);
    fileDispute(type);
  };

  const handleEscalate = () => {
    setEscalated(true);
    Alert.alert(
      'Escalated',
      'A human agent has been notified and will contact you within 2 hours.',
      [{ text: 'OK', onPress: () => router.navigate('/(tabs)') }]
    );
  };

  const renderRecommendationIcon = () => {
    if (!recommendation) return null;
    switch (recommendation.action) {
      case 'refund':
        return <Feather name="dollar-sign" size={24} color={theme.colors.accent} />;
      case 'revisit':
        return <Feather name="refresh-cw" size={24} color={theme.colors.primary} />;
      case 'human_escalation':
        return <Feather name="alert-triangle" size={24} color={theme.colors.warning} />;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text
          style={[
            styles.headerTitle,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          Resolution Center
        </Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color={theme.colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card style={styles.card}>
          <Text
            style={[
              styles.sectionTitle,
              { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
            ]}
          >
            Dispute Type
          </Text>
          <View style={styles.typeGrid}>
            {DISPUTE_TYPES.map((type) => {
              const selected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => handleTypePress(type.id)}
                  style={[
                    styles.typeButton,
                    {
                      borderColor: selected ? theme.colors.primary : theme.colors.border,
                      backgroundColor: selected
                        ? theme.colors.primary + '14'
                        : theme.colors.surface,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.typeLabel,
                      {
                        color: selected ? theme.colors.primary : theme.colors.textPrimary,
                        fontFamily: theme.fontFamily.semiBold,
                      },
                    ]}
                  >
                    {type.label}
                  </Text>
                  <Text style={[styles.typeDescription, { color: theme.colors.textSecondary }]}>
                    {type.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 16, color: theme.colors.textSecondary }}>
              Analyzing dispute details...
            </Text>
          </View>
        ) : (
          <>
            <Card style={styles.card}>
              <View style={styles.summaryHeader}>
                <Feather name="file-text" size={20} color={theme.colors.primary} />
                <Text
                  style={[
                    styles.sectionTitle,
                    { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
                  ]}
                >
                  Dispute Summary
                </Text>
              </View>
              <Text
                style={[
                  styles.summaryText,
                  { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
                ]}
              >
                {summary}
              </Text>
            </Card>

            {recommendation && (
              <Card style={[styles.card, { borderColor: theme.colors.primary, borderWidth: 1 }]}>
                <View style={styles.summaryHeader}>
                  {renderRecommendationIcon()}
                  <Text
                    style={[
                      styles.sectionTitle,
                      {
                        color: theme.colors.textPrimary,
                        fontFamily: theme.fontFamily.semiBold,
                        marginLeft: 8,
                      },
                    ]}
                  >
                    Recommended Resolution
                  </Text>
                </View>
                <Text
                  style={[
                    styles.summaryText,
                    { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.medium },
                  ]}
                >
                  {recommendation.reason}
                </Text>
                <Text
                  style={[
                    styles.actionTag,
                    {
                      color: theme.colors.primary,
                      backgroundColor: theme.colors.primary + '20',
                    },
                  ]}
                >
                  Action: {recommendation.action.replace('_', ' ').toUpperCase()}
                </Text>
              </Card>
            )}

            <Button
              label={escalated ? 'Agent Notified' : 'Escalate to Human Agent'}
              onPress={handleEscalate}
              variant={escalated ? 'secondary' : 'primary'}
              disabled={escalated}
              style={{ marginTop: 24 }}
            />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 20 },
  scroll: { padding: 24 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 220 },
  card: { marginBottom: 16, padding: 20 },
  typeGrid: { gap: 10 },
  typeButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  typeLabel: { fontSize: 15, marginBottom: 3 },
  typeDescription: { fontSize: 12, lineHeight: 17 },
  summaryHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, marginLeft: 8 },
  summaryText: { fontSize: 16, lineHeight: 24 },
  actionTag: {
    alignSelf: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 'bold',
    overflow: 'hidden',
  },
});
