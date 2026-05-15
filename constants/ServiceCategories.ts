/**
 * Service categories supported by CirclCare AI.
 * Values are snake_case strings used in API requests and matching engine.
 */
export enum ServiceCategory {
  ClinicVisit = 'clinic_visit',
  HomeNurse = 'home_nurse',
  Caregiver = 'caregiver',
  Physiotherapy = 'physiotherapy',
  MedicinePickup = 'medicine_pickup',
  LabSample = 'lab_sample',
  MealPlan = 'meal_plan',
  DailySupport = 'daily_support',
  ElderCompanion = 'elder_companion',
}

export const ServiceDisplayNames: Record<ServiceCategory, string> = {
  [ServiceCategory.ClinicVisit]: 'Clinic Visit',
  [ServiceCategory.HomeNurse]: 'Home Nurse',
  [ServiceCategory.Caregiver]: 'Caregiver',
  [ServiceCategory.Physiotherapy]: 'Physiotherapy',
  [ServiceCategory.MedicinePickup]: 'Medicine Pickup',
  [ServiceCategory.LabSample]: 'Lab Sample',
  [ServiceCategory.MealPlan]: 'Meal Plan',
  [ServiceCategory.DailySupport]: 'Daily Support',
  [ServiceCategory.ElderCompanion]: 'Elder Companion',
};

export const ServiceIcons: Record<ServiceCategory, string> = {
  [ServiceCategory.ClinicVisit]: 'medical',
  [ServiceCategory.HomeNurse]: 'heart-circle',
  [ServiceCategory.Caregiver]: 'people',
  [ServiceCategory.Physiotherapy]: 'fitness',
  [ServiceCategory.MedicinePickup]: 'medkit',
  [ServiceCategory.LabSample]: 'flask',
  [ServiceCategory.MealPlan]: 'restaurant',
  [ServiceCategory.DailySupport]: 'home',
  [ServiceCategory.ElderCompanion]: 'happy',
};

/** Services flagged as high-risk that require verified providers */
export const HIGH_RISK_SERVICES: ServiceCategory[] = [
  ServiceCategory.HomeNurse,
  ServiceCategory.Physiotherapy,
  ServiceCategory.LabSample,
];
