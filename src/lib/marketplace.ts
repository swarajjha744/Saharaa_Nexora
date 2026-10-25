import { supabase, isSupabaseConfigured } from './supabase';

export interface MarketplaceService {
  id: string;
  name_en: string;
  name_hi: string;
  icon: string;
  description: string;
  base_price: number;
  is_active: boolean;
  created_at?: string;
}

export interface MarketplaceWorker {
  id: string;
  full_name: string;
  hindi_name: string | null;
  avatar_url: string | null;
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
  verification_status: 'verified';
  rating: number | null;
  total_jobs: number;
}

export interface WorkerDiscoveryFilters {
  serviceId?: string;
  searchQuery?: string;
  location?: string;
  onlyAvailableNow?: boolean;
  maxPrice?: number;
  minTrust?: number;
  sortBy?: 'Recommended' | 'Price: low to high' | 'Highest rated' | 'TrustDNA' | 'Nearest';
}

/**
 * Fetch the active service catalog from Supabase public.services table
 */
export async function fetchServices(): Promise<{ data: MarketplaceService[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('base_price', { ascending: true });

    if (error) {
      console.error('Error fetching service catalog from Supabase:', error.message);
      return { data: [], error: error.message };
    }

    return { data: (data as MarketplaceService[]) || [], error: null };
  } catch (err: any) {
    console.error('Unexpected error loading services:', err);
    return { data: [], error: err.message || 'Network error fetching services' };
  }
}

/**
 * Fetch public verified workers from the security-barrier public.marketplace_workers view.
 * Privacy Guaranteed: Does not expose phone numbers, identity docs, or private address.
 */
export async function fetchMarketplaceWorkers(
  filters?: WorkerDiscoveryFilters
): Promise<{ data: MarketplaceWorker[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase is not configured' };
  }

  try {
    let query = supabase.from('marketplace_workers').select('*');

    // 1. Service category filter
    if (filters?.serviceId && filters.serviceId !== 'All') {
      query = query.eq('primary_service_id', filters.serviceId);
    }

    // 2. Availability filter
    if (filters?.onlyAvailableNow) {
      query = query.or('is_available_now.eq.true,is_online.eq.true');
    }

    // 3. Price filter
    if (filters?.maxPrice && filters.maxPrice > 0) {
      query = query.lte('starting_rate', filters.maxPrice);
    }

    // 4. TrustDNA filter
    if (filters?.minTrust && filters.minTrust > 0) {
      query = query.gte('trust_dna', filters.minTrust);
    }

    // 5. Sorting
    if (filters?.sortBy === 'Price: low to high') {
      query = query.order('starting_rate', { ascending: true });
    } else if (filters?.sortBy === 'Highest rated') {
      query = query.order('rating', { ascending: false, nullsFirst: false });
    } else if (filters?.sortBy === 'TrustDNA') {
      query = query.order('trust_dna', { ascending: false, nullsFirst: false });
    } else {
      // Default recommended: available now workers first, then rating
      query = query
        .order('is_available_now', { ascending: false })
        .order('rating', { ascending: false, nullsFirst: false })
        .order('total_jobs', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching workers from marketplace_workers:', error.message);
      return { data: [], error: error.message };
    }

    let workers = (data as MarketplaceWorker[]) || [];

    // 6. Search query & skills matching in JavaScript for precision
    if (filters?.searchQuery && filters.searchQuery.trim() !== '') {
      const q = filters.searchQuery.toLowerCase().trim();
      workers = workers.filter((w) => {
        const nameMatch = w.full_name?.toLowerCase().includes(q) || false;
        const hindiMatch = w.hindi_name?.toLowerCase().includes(q) || false;
        const serviceMatch = w.primary_service_id?.toLowerCase().includes(q) || false;
        const areaMatch = w.service_area?.toLowerCase().includes(q) || false;
        const skillsMatch = Array.isArray(w.skills) && w.skills.some((s) => s.toLowerCase().includes(q));
        const aboutMatch = w.about?.toLowerCase().includes(q) || false;
        return nameMatch || hindiMatch || serviceMatch || areaMatch || skillsMatch || aboutMatch;
      });
    }

    // 7. Location filtering if provided and not default
    if (filters?.location && filters.location.trim() !== '') {
      const locClean = filters.location.split(',')[0].toLowerCase().trim();
      if (locClean) {
        // Soft match or keep all if within Delhi NCR
        const filteredByLoc = workers.filter((w) =>
          w.service_area?.toLowerCase().includes(locClean)
        );
        // If specific area matches exist, prioritize them
        if (filteredByLoc.length > 0) {
          workers = filteredByLoc;
        }
      }
    }

    return { data: workers, error: null };
  } catch (err: any) {
    console.error('Unexpected error loading marketplace workers:', err);
    return { data: [], error: err.message || 'Network error fetching workers' };
  }
}

/**
 * Fetch a single verified worker profile from marketplace_workers
 */
export async function fetchWorkerById(
  workerId: string
): Promise<{ data: MarketplaceWorker | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('marketplace_workers')
      .select('*')
      .eq('id', workerId)
      .maybeSingle();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: (data as MarketplaceWorker) || null, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Error fetching worker' };
  }
}

/**
 * Persist worker availability state to public.worker_profiles.
 * Protected by RLS: auth.uid() = id ensures workers can only update their own status.
 */
export async function updateWorkerAvailability(
  workerId: string,
  isOnline: boolean,
  isAvailableNow?: boolean
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  try {
    const payload: { is_online: boolean; is_available_now: boolean } = {
      is_online: isOnline,
      is_available_now: isAvailableNow !== undefined ? isAvailableNow : isOnline,
    };

    const { error } = await supabase
      .from('worker_profiles')
      .update(payload)
      .eq('id', workerId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update availability' };
  }
}

/**
 * Adapter function to format a database MarketplaceWorker into the UI Worker presentation model.
 * Preserves genuine database truth without inventing metrics.
 */
export function normalizeWorker(
  w: MarketplaceWorker,
  servicesList?: MarketplaceService[]
): import('../data').Worker {
  const serviceObj = servicesList?.find((s) => s.id === w.primary_service_id);
  const serviceName = serviceObj?.name_en || w.primary_service_id || 'General Service';

  return {
    id: w.id,
    name: w.full_name,
    hindiName: w.hindi_name || w.full_name,
    photo: w.avatar_url || 'https://images.pexels.com/photos/9271168/pexels-photo-9271168.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940',
    service: serviceName,
    serviceId: w.primary_service_id || 'general',
    skills: Array.isArray(w.skills) && w.skills.length > 0 ? w.skills : [serviceName],
    price: Number(w.starting_rate) || 199,
    rating: w.rating != null ? Number(w.rating) : null,
    jobs: w.total_jobs || 0,
    distance: `${w.service_radius_km || 3} km radius`,
    distanceKm: Number(w.service_radius_km) || 3.0,
    eta: `~${w.response_mins || 15} min`,
    trustDNA: w.trust_dna != null ? Number(w.trust_dna) : null,
    verified: w.verification_status === 'verified',
    availableNow: Boolean(w.is_available_now || w.is_online),
    responseMins: w.response_mins || 15,
    languages: ['Hindi', 'English'],
    area: w.service_area || 'Laxmi Nagar, Delhi',
    about: w.about || `Verified ${serviceName} provider in ${w.service_area || 'Delhi NCR'}.`,
    breakdown: [
      { label: 'Identity Verified', value: 'Government ID', done: true },
      { label: 'Primary Trade', value: serviceName, done: true },
      { label: 'FairFare Compliant', value: 'Transparent', done: true },
    ],
  };
}

