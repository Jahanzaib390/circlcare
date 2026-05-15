import { ServiceCategory } from '@/constants/ServiceCategories';

export interface PricingFactor {
  id: string;
  label: string;
  multiplier: number;
  applies_when: string; // human-readable condition description
}

export interface ServiceDefinition {
  category: ServiceCategory;
  display_name: string;
  base_rate_pkr: number;
  hourly_rate_pkr: number;
  requires_verification: boolean;
  typical_duration_minutes: number;
  pricing_factors: PricingFactor[];
}
