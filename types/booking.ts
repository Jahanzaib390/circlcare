import { BookingStatus } from '@/constants/BookingStatuses';
import { ServiceCategory } from '@/constants/ServiceCategories';
import { PricingBreakdown } from '@/types/pricing';
import { ParsedRequest } from '@/types/request';

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly';
  days_of_week?: number[]; // 0=Sun … 6=Sat
  end_date?: string; // ISO 8601
}

export interface BookingTimelineEvent {
  status: BookingStatus;
  timestamp: string; // ISO 8601
  note?: string;
}

export interface BookingNotificationPayload {
  type: 'booking_created' | 'booking_reminder' | 'provider_delayed' | 'provider_cancelled';
  recipient: 'family_group' | 'primary_contact' | 'user';
  title: string;
  message: string;
  scheduled_for?: string;
  booking_id: string;
  provider_id: string;
}

export interface Booking {
  booking_id: string;
  user_id: string;
  provider_id: string;
  service_bundle: ServiceCategory[];
  scheduled_start: string; // ISO 8601
  status: BookingStatus;
  quoted_price: number; // PKR
  pricing_breakdown: PricingBreakdown[];
  risk_level: 'low' | 'medium' | 'high';
  family_notified: boolean;
  recurring?: RecurringSchedule;
  timeline: BookingTimelineEvent[];
  cancellation_reason?: string;
  compensation_discount?: number; // PKR
  delay_reason?: string;
  provider_eta_minutes?: number;
  location_from: string;
  location_to?: string;
  original_request?: ParsedRequest;
}
