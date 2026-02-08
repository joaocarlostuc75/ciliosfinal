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

export interface User {
  id: string;
  email: string;
  salon_id: string;
}

export interface BlockedTime {
  id: string;
  salon_id: string;
  start_time: string;
  end_time: string;
  reason: string;
}