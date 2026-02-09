
export enum AppointmentStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  BLOCKED = 'BLOCKED',
  CANCELLED = 'CANCELLED'
}

export type SubscriptionPlan = 'FREE' | 'MONTHLY' | 'YEARLY' | 'LIFETIME' | string;

export interface TimeSlot {
  start: string; // "08:00"
  end: string;   // "12:00"
}

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday...
  isOpen: boolean;
  slots: TimeSlot[];
}

export interface Salon {
  id: string;
  name: string;
  slug: string; // unique identifier for public url
  logo_url: string;
  phone: string;
  address: string;
  theme_color?: string;
  opening_hours: DaySchedule[]; // Structured data instead of string
  
  // Subscription Fields
  subscription_status: SubscriptionStatus;
  subscription_plan: SubscriptionPlan;
  subscription_end_date?: string; // ISO Date
  is_lifetime_free?: boolean;
  
  created_at: string; // To calculate trial period
  owner_email?: string;
  password?: string; // ADDED: Security check for mock DB
  last_login?: string; // ISO Date for Churn monitoring
}

export interface SystemPlan {
  id: string;
  name: string;
  price: number;
  period: 'monthly' | 'yearly';
  features: string[];
  is_popular?: boolean;
  is_public?: boolean; // New: Hide plan from public view
}

export interface GlobalSettings {
  id: string;
  default_logo_url: string;
  app_name?: string; // White Label Name
  broadcast_message?: string; // Global System Notification
  super_admin_phone?: string; // Contact for support/notifications
  updated_at: string;
}

export interface Service {
  id: string;
  salon_id: string;
  name: string;
  description: string;
  price: number;
  duration_min: number;
  image_url: string;
}

export interface Client {
  id: string;
  salon_id: string;
  name: string;
  whatsapp: string;
  created_at: string;
}

export interface Appointment {
  id: string;
  salon_id: string;
  service_id: string;
  client_id: string;
  start_time: string; // ISO String
  end_time: string; // ISO String
  status: AppointmentStatus;
  created_at: string;
  client_name?: string; // joined for display
  service_name?: string; // joined for display
  service_price?: number; // joined for display
}

export interface Product {
  id: string;
  salon_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  image_url?: string;
}

export interface Order {
  id: string;
  salon_id: string;
  product_id: string;
  client_name: string;
  client_phone: string;
  status: OrderStatus;
  created_at: string;
  product_name?: string; // joined for display
  product_price?: number; // joined for display
}

export interface BlockedTime {
  id: string;
  salon_id: string;
  start_time: string;
  end_time: string;
  reason: string;
}
