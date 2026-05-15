import { ServiceCategory } from '@/constants/ServiceCategories';

export type WeightKey =
  | 'specialization'
  | 'availabilityFit'
  | 'reliability'
  | 'language'
  | 'genderComfort'
  | 'ratingRecency'
  | 'cancellationRisk'
  | 'distance'
  | 'priceFit';

export type MatchingWeights = Record<WeightKey, number>;

/** Default scoring weights (must sum to 1.0) */
export const DEFAULT_WEIGHTS: MatchingWeights = {
  specialization: 0.2,
  availabilityFit: 0.15,
  reliability: 0.15,
  language: 0.1,
  genderComfort: 0.1,
  ratingRecency: 0.1,
  cancellationRisk: 0.1,
  distance: 0.05,
  priceFit: 0.05,
};

/** Per-category weight overrides */
export const CATEGORY_WEIGHTS: Partial<Record<ServiceCategory, MatchingWeights>> = {
  [ServiceCategory.HomeNurse]: {
    specialization: 0.25,
    genderComfort: 0.15,
    reliability: 0.15,
    availabilityFit: 0.15,
    cancellationRisk: 0.1,
    ratingRecency: 0.1,
    language: 0.05,
    distance: 0.03,
    priceFit: 0.02,
  },
  [ServiceCategory.Caregiver]: {
    specialization: 0.2,
    genderComfort: 0.15,
    language: 0.15,
    reliability: 0.15,
    availabilityFit: 0.1,
    ratingRecency: 0.1,
    cancellationRisk: 0.1,
    distance: 0.03,
    priceFit: 0.02,
  },
};

/** Confidence threshold below which clarification is requested */
export const CONFIDENCE_THRESHOLD = 0.7;
