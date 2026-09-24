import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface Vehicle {
  id: number;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  fuel_type?: string;
  vehicle_type?: string;
  variant?: string;
  transmission?: string;
  color?: string;
  vin?: string;
  engine_number?: string;
  registration_date?: string;
  registration_state?: string;
  rto?: string;
  insurance_provider?: string;
  policy_number?: string;
  policy_type?: string;
  policy_start_date?: string;
  policy_expiry_date?: string;
}

export interface Claim {
  claim_id: string;
  vehicle_id: number;
  status: string;
  incident_date: string;
  incident_description: string;
  policy_number: string;
  created_at: string;
  evidence?: { file_name: string; file_path: string }[];
  assessment?: any;
  service_center_id?: number;
  service_center_name?: string;
}

export interface User {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  role: 'user' | 'service_center' | 'adjuster';
  first_name?: string;
  last_name?: string;
  date_of_birth?: string;
  gender?: string;
  address_line?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
}

export interface ServiceCenter {
  id: number;
  name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  supported_brands: string[];
  insurance_providers: string[];
  rating: number;
  distance_km?: number;
  opening_hours?: string;
}

export interface ServiceRequest {
  id: string;
  claim_id: string;
  service_center_id: number;
  service_center_name: string;
  request_type: string;
  preferred_date: string;
  preferred_time: string;
  priority: string;
  pickup_required: boolean;
  pickup_address?: string;
  customer_notes?: string;
  status: 'Submitted' | 'Under Review' | 'Accepted' | 'Appointment Confirmed' | 'Vehicle Received' | 'Inspection' | 'Repair In Progress' | 'Repair Completed' | 'Ready For Pickup' | 'Completed' | 'Rejected' | 'Cancelled';
  created_at: string;
}

export interface Appointment {
  id: string;
  service_request_id: string;
  service_center_name: string;
  vehicle_info: string;
  appointment_date: string;
  appointment_time: string;
  status: 'Confirmed' | 'Completed' | 'Rescheduled' | 'Cancelled';
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  type: 'assessment' | 'claim' | 'service_request' | 'appointment' | 'system';
}
