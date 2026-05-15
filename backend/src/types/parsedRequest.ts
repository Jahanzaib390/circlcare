/** Mirror of frontend types/request.ts — kept in sync manually */

export type Language = string; // e.g. 'urdu', 'english', 'punjabi'

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

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  days_of_week?: number[];
  end_date?: string;
}

export interface ProviderPreferences {
  gender?: 'female_required' | 'male_required' | 'female_preferred' | 'any';
  language?: Language[];
  language_required?: boolean;
  verified_only: boolean;
  elder_care_experience?: boolean;
}

export interface ParsedRequest {
  service_bundle: ServiceCategory[];
  patient: string;
  location_from: string;
  location_to?: string;
  time_preference: string;
  scheduled_datetime?: string; // ISO 8601
  mobility_needs: string[];
  provider_preferences: ProviderPreferences;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  risk_level: 'low' | 'medium' | 'high';
  recurring?: RecurringSchedule;
  clarification_needed: boolean;
  clarification_question?: string;
  confidence: number; // 0–1
}
