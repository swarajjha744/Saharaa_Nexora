export type UserRole = 'customer' | 'worker' | 'admin';
export type PreferredLanguage = 'en' | 'hi';
export type VerificationStatus = 'pending' | 'in_review' | 'verified' | 'rejected';

export interface UserProfile {
  id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  preferred_language: PreferredLanguage;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkerProfile {
  id: string;
  hindi_name: string | null;
  primary_service_id: string | null;
  skills: string[];
  experience_years: number;
  starting_rate: number;
  is_online: boolean;
  is_available_now: boolean;
  service_radius_km: number;
  service_area: string;
  about: string | null;
  response_mins: number;
  trust_dna: number | null;
  verification_status: VerificationStatus;
  rating: number | null;
  total_jobs: number;
  created_at: string;
  updated_at: string;
}

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
  role: 'customer' | 'worker';
  phone?: string;
  preferredLanguage?: PreferredLanguage;
  primaryServiceId?: string;
  startingRate?: number;
}

export interface AuthState {
  user: import('@supabase/supabase-js').User | null;
  session: import('@supabase/supabase-js').Session | null;
  profile: UserProfile | null;
  workerProfile: WorkerProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}
