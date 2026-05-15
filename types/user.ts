import { Language } from '@/constants/Languages';

export interface Location {
  id: string;
  label: string; // e.g. "Home", "Office"
  area: string; // neighbourhood / area name
  city: string;
  lat?: number;
  lng?: number;
  address?: string;
}

export interface UserPreferences {
  preferred_language: Language;
  preferred_provider_gender?: 'female' | 'male' | 'any';
  notifications_enabled: boolean;
  demo_mode: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  phone?: string;
  saved_locations: Location[];
  preferences: UserPreferences;
  created_at: string; // ISO 8601
}
