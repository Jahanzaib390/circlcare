/**
 * haversine.ts — Straight-line distance calculation between two geo points.
 * Includes elder-care travel time estimation with mandatory 15-minute buffer.
 */

export interface GeoPoint {
  lat: number;
  lng: number;
  area: string;
}

export interface TravelEstimate {
  distance_km: number;
  travel_time_minutes: number;
  elder_buffer_minutes: number;
  suggested_arrival_buffer_minutes: number;
}

const EARTH_RADIUS_KM = 6371;
const TRAFFIC_BUFFER_MINUTES = 5;
const ELDER_BUFFER_MINUTES = 15;
const KM_PER_MINUTE = 1 / 3.5; // ~17 km/h average urban speed accounting for stops

/**
 * Calculate the straight-line (haversine) distance between two coordinates.
 */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const haversine =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;

  const c = 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));

  return EARTH_RADIUS_KM * c;
}

/**
 * Estimate travel time for a provider to reach the patient.
 * Returns distance + travel time + mandatory elder-care buffer.
 *
 * Formula: travel_time = distance_km * 3.5 + TRAFFIC_BUFFER
 * Elder buffer: always +15 min (for elder mobility considerations at both ends)
 */
export function estimateTravelTime(distanceKm: number): TravelEstimate {
  const travel_time_minutes = Math.round(distanceKm * 3.5 + TRAFFIC_BUFFER_MINUTES);
  const elder_buffer_minutes = ELDER_BUFFER_MINUTES;
  const suggested_arrival_buffer_minutes = travel_time_minutes + elder_buffer_minutes;

  return {
    distance_km: Math.round(distanceKm * 10) / 10,
    travel_time_minutes,
    elder_buffer_minutes,
    suggested_arrival_buffer_minutes,
  };
}

/**
 * Check if a provider's service radius covers the patient location.
 * Uses haversine distance vs provider's declared service_radius_km.
 */
export function isWithinServiceRadius(
  providerLocation: GeoPoint,
  patientLocation: GeoPoint,
  serviceRadiusKm: number
): boolean {
  const distance = haversineKm(providerLocation, patientLocation);
  return distance <= serviceRadiusKm;
}
