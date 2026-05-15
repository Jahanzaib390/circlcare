/** Full Provider schema — mirrors data/providers.json and frontend types/provider.ts */

export type ServiceCategory =
  | 'clinic_visit'
  | 'home_nurse'
  | 'caregiver'
  | 'physiotherapy'
  | 'medicine_pickup'
  | 'lab_sample'
  | 'meal_plan'
  | 'daily_support'
  | 'elder_companion';

export interface GeoPoint {
  lat: number;
  lng: number;
  area: string;
}

export interface AvailabilitySlot {
  day: 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
  start_time: string; // "HH:MM" 24h
  end_time: string;   // "HH:MM" 24h
}

export interface Provider {
  id: string;
  name: string;
  provider_type: 'individual' | 'agency';
  gender: 'male' | 'female' | 'other';
  services: ServiceCategory[];
  specializations: string[];
  languages: string[];
  areas: string[];
  home_visit: boolean;
  verified: boolean;
  family_friendly: boolean;
  wheelchair_support: boolean;
  rating: number;           // 0–5
  review_count: number;
  recent_review_score: number; // avg of last 5 reviews
  on_time_score: number;    // 0–1
  cancellation_rate: number; // 0–1
  base_rate: number;        // PKR per visit
  hourly_rate: number;      // PKR per hour
  experience_years: number;
  capacity_per_day: number;
  availability: AvailabilitySlot[];
  location: GeoPoint;
  service_radius_km: number;
  risk_flags: string[];
  past_disputes: number;
  photo_url?: string;
  bio?: string;
}
