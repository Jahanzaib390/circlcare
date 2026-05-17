import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { Button } from '@/components/ui/Button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useRequestStore } from '@/hooks/useRequestStore';
import { useTheme } from '@/hooks/useTheme';
import providersJson from '@/data/providers.json';
import type { Provider } from '@/types/provider';

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

const PROVIDERS = providersJson as Provider[];

const LOCATION_COORDS: Record<string, { latitude: number; longitude: number; city: string }> = {
  dha: { latitude: 31.482, longitude: 74.401, city: 'lahore' },
  'dha phase 5 lahore': { latitude: 31.4697, longitude: 74.4007, city: 'lahore' },
  'model town': { latitude: 31.516, longitude: 74.345, city: 'lahore' },
  'model town lahore': { latitude: 31.516, longitude: 74.345, city: 'lahore' },
  gulberg: { latitude: 31.524, longitude: 74.359, city: 'lahore' },
  'gulberg iii lahore': { latitude: 31.524, longitude: 74.359, city: 'lahore' },
  lahore: { latitude: 31.5204, longitude: 74.3587, city: 'lahore' },
  'clifton karachi': { latitude: 24.8138, longitude: 67.0302, city: 'karachi' },
  clifton: { latitude: 24.8138, longitude: 67.0302, city: 'karachi' },
  'dha karachi': { latitude: 24.7936, longitude: 67.0644, city: 'karachi' },
  'gulshan-e-iqbal karachi': { latitude: 24.918, longitude: 67.0971, city: 'karachi' },
  gulshan: { latitude: 24.918, longitude: 67.0971, city: 'karachi' },
  karachi: { latitude: 24.8607, longitude: 67.0011, city: 'karachi' },
  'f-7 islamabad': { latitude: 33.7206, longitude: 73.0553, city: 'islamabad' },
  'f-8 islamabad': { latitude: 33.7115, longitude: 73.0397, city: 'islamabad' },
  'g-9 islamabad': { latitude: 33.6844, longitude: 73.0436, city: 'islamabad' },
  islamabad: { latitude: 33.6844, longitude: 73.0479, city: 'islamabad' },
};

const DEFAULT_MAP_POINT = LOCATION_COORDS.lahore;

function resolveMapPoint(location: string) {
  const normalized = location.toLowerCase().trim();
  if (!normalized || normalized === 'not specified' || normalized === 'flexible') {
    return DEFAULT_MAP_POINT;
  }
  if (normalized === 'current_location_requested') {
    return DEFAULT_MAP_POINT;
  }

  const exact = LOCATION_COORDS[normalized];
  if (exact) return exact;

  const matchedKey = Object.keys(LOCATION_COORDS).find(
    (key) => normalized.includes(key) || key.includes(normalized)
  );
  return matchedKey ? LOCATION_COORDS[matchedKey] : DEFAULT_MAP_POINT;
}

function providerCity(provider: Provider) {
  const text = [...provider.areas, provider.location.area].join(' ').toLowerCase();
  if (
    text.includes('karachi') ||
    text.includes('clifton') ||
    text.includes('gulshan') ||
    text.includes('nazimabad')
  ) {
    return 'karachi';
  }
  if (
    text.includes('islamabad') ||
    text.includes('f-7') ||
    text.includes('f-8') ||
    text.includes('g-9') ||
    text.includes('blue area')
  ) {
    return 'islamabad';
  }
  return 'lahore';
}

function makeRegion(point: { latitude: number; longitude: number }): Region {
  return {
    latitude: point.latitude,
    longitude: point.longitude,
    latitudeDelta: 0.13,
    longitudeDelta: 0.13,
  };
}

export default function LocationPickerModal() {
  const theme = useTheme();
  const router = useRouter();
  const { parsedRequest, setParsedRequest } = useRequestStore();
  const [manualLocation, setManualLocation] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const mapPoint = resolveMapPoint(manualLocation || parsedRequest?.location_from || '');
  const cityProviders = PROVIDERS.filter((provider) => providerCity(provider) === mapPoint.city)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 8);
  const mapRegion = makeRegion(mapPoint);

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
      setManualLocation(locationLabel);
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

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
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

        <View style={[styles.mapCard, { backgroundColor: theme.colors.surface }]}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            region={mapRegion}
            showsUserLocation
            showsMyLocationButton={false}
            toolbarEnabled={false}
          >
            <Marker
              coordinate={mapPoint}
              title="Service location"
              description={manualLocation || parsedRequest?.location_from || 'Default demo area'}
              pinColor={Colors.primary}
            />
            {cityProviders.map((provider) => (
              <Marker
                key={provider.id}
                coordinate={{
                  latitude: provider.location.lat,
                  longitude: provider.location.lng,
                }}
                title={provider.name}
                description={`${provider.services[0].replace(/_/g, ' ')} - ${provider.rating.toFixed(1)} rating`}
                pinColor={provider.verified ? Colors.accent : Colors.warning}
              />
            ))}
          </MapView>
          <View style={styles.mapLegend}>
            <View style={[styles.legendPill, { backgroundColor: Colors.primary + '18' }]}>
              <Ionicons name="location" size={13} color={Colors.primary} />
              <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>
                Selected area
              </Text>
            </View>
            <View style={[styles.legendPill, { backgroundColor: Colors.accent + '18' }]}>
              <Ionicons name="medkit" size={13} color={Colors.accent} />
              <Text style={[styles.legendText, { color: theme.colors.textPrimary }]}>
                Nearby providers
              </Text>
            </View>
          </View>
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
      </ScrollView>
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
  content: { padding: Spacing.md, paddingBottom: Spacing.xl, gap: 14 },
  alert: {
    flexDirection: 'row',
    gap: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  alertText: { flex: 1, fontSize: 14, lineHeight: 20 },
  mapCard: {
    height: 230,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  map: { flex: 1 },
  mapLegend: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 10,
    flexDirection: 'row',
    gap: 8,
  },
  legendPill: {
    borderRadius: Radius.full,
    paddingHorizontal: 10,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendText: { fontSize: 11, fontWeight: '700' },
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
