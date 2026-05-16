import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useRequestStore } from '@/hooks/useRequestStore';
import { useTheme } from '@/hooks/useTheme';

const SAVED_LOCATIONS = [
  'DHA Phase 5 Lahore',
  'Model Town Lahore',
  'Gulberg III Lahore',
  'Clifton Karachi',
  'DHA Karachi',
  'Gulshan-e-Iqbal Karachi',
  'F-7 Islamabad',
  'F-8 Islamabad',
  'G-9 Islamabad',
];

export default function LocationPickerModal() {
  const theme = useTheme();
  const router = useRouter();
  const { parsedRequest, setParsedRequest } = useRequestStore();
  const [manualLocation, setManualLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');

  const applyLocation = (location: string) => {
    if (!parsedRequest || !location.trim()) return;
    setParsedRequest({
      ...parsedRequest,
      location_from: location.trim(),
      clarification_needed:
        parsedRequest.service_bundle.length === 0 || parsedRequest.confidence < 0.7,
      clarification_question:
        parsedRequest.service_bundle.length === 0
          ? 'Which care service should we arrange?'
          : undefined,
      confidence: Math.max(parsedRequest.confidence, 0.72),
    });
    router.back();
  };

  const useCurrentLocation = async () => {
    if (!parsedRequest || isLocating) return;
    setIsLocating(true);
    setLocationError('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== Location.PermissionStatus.GRANTED) {
        setLocationError(
          'Location permission was not granted. Choose a saved area or enter it manually.'
        );
        return;
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const [address] = await Location.reverseGeocodeAsync(position.coords);
      const parts = [address?.district, address?.subregion, address?.city, address?.region].filter(
        Boolean
      );
      const locationLabel =
        parts.length > 0
          ? Array.from(new Set(parts)).join(', ')
          : `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
      applyLocation(locationLabel);
    } catch (error) {
      console.warn('[LocationPicker] Failed to get current location:', error);
      setLocationError(
        'Could not read your current location. Please enter the Lahore area manually.'
      );
    } finally {
      setIsLocating(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <Text
          style={[
            styles.title,
            { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.bold },
          ]}
        >
          Service Location
        </Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={22} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <View style={styles.content}>
        <View
          style={[
            styles.alert,
            { backgroundColor: Colors.warning + '12', borderColor: Colors.warning + '35' },
          ]}
        >
          <Ionicons name="location-outline" size={18} color={Colors.warning} />
          <Text
            style={[
              styles.alertText,
              { color: theme.colors.textSecondary, fontFamily: theme.fontFamily.regular },
            ]}
          >
            Choose a saved area or enter the address where care is needed.
          </Text>
        </View>

        <View style={styles.savedList}>
          <Pressable
            style={[
              styles.locationRow,
              { backgroundColor: theme.colors.surface, borderColor: theme.colors.primary },
            ]}
            onPress={useCurrentLocation}
            disabled={isLocating}
          >
            {isLocating ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="locate" size={18} color={theme.colors.primary} />
            )}
            <Text
              style={[
                styles.locationText,
                { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
              ]}
            >
              {isLocating ? 'Getting current location...' : 'Use Current Location'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
          </Pressable>

          {SAVED_LOCATIONS.map((location) => (
            <Pressable
              key={location}
              style={[
                styles.locationRow,
                { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
              ]}
              onPress={() => applyLocation(location)}
            >
              <Ionicons name="home-outline" size={18} color={theme.colors.primary} />
              <Text
                style={[
                  styles.locationText,
                  { color: theme.colors.textPrimary, fontFamily: theme.fontFamily.semiBold },
                ]}
              >
                {location}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={theme.colors.textMuted} />
            </Pressable>
          ))}
        </View>

        {locationError ? (
          <Text
            style={[
              styles.errorText,
              { color: theme.colors.danger, fontFamily: theme.fontFamily.regular },
            ]}
          >
            {locationError}
          </Text>
        ) : null}

        <TextInput
          value={manualLocation}
          onChangeText={setManualLocation}
          placeholder="Enter another Lahore area"
          placeholderTextColor={theme.colors.textMuted}
          style={[
            styles.input,
            {
              color: theme.colors.textPrimary,
              borderColor: theme.colors.border,
              backgroundColor: theme.colors.surface,
              fontFamily: theme.fontFamily.regular,
            },
          ]}
        />
        <Button
          label="Use This Location"
          variant="primary"
          fullWidth
          onPress={() => applyLocation(manualLocation)}
          disabled={!manualLocation.trim()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { flex: 1, fontSize: 20 },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md, gap: 14 },
  alert: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  alertText: { flex: 1, fontSize: 14, lineHeight: 20 },
  savedList: { gap: 10 },
  locationRow: {
    minHeight: 52,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  locationText: { flex: 1, fontSize: 15 },
  errorText: { fontSize: 13, lineHeight: 18 },
  input: {
    minHeight: 50,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
});
