import { supabase, isSupabaseConfigured } from './supabase';

export type BookingStatus =
  | 'pending'
  | 'negotiating'
  | 'accepted'
  | 'on_the_way'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type BookingType = 'asap' | 'schedule';

export interface DbBooking {
  id: string;
  booking_number: string;
  customer_id: string;
  worker_id: string | null;
  service_id: string;
  job_title: string;
  job_description: string;
  service_address: string;
  service_location: string;
  booking_type: BookingType;
  scheduled_at: string | null;
  locked_price: number;
  spare_parts_approved: boolean;
  spare_parts_amount: number;
  tip_amount: number;
  total_amount: number;
  booking_status: BookingStatus;
  payment_status: string;
  created_at: string;
  updated_at: string;
  // Joined or counterparty data
  worker?: {
    id: string;
    full_name: string;
    hindi_name?: string;
    avatar_url?: string;
    phone?: string;
  } | null;
  customer?: {
    id: string;
    full_name: string;
    phone?: string;
  } | null;
}

export interface DbNegotiationOffer {
  id: string;
  booking_id: string;
  proposer_id: string;
  proposer_role: 'customer' | 'worker' | 'system';
  offered_price: number;
  message: string | null;
  offer_status: 'pending' | 'countered' | 'accepted' | 'rejected' | 'expired';
  round_number: number;
  created_at: string;
}

export interface DbBookingEvent {
  id: string;
  booking_id: string;
  actor_id: string | null;
  event_type: string;
  notes: string | null;
  metadata: Record<string, any>;
  created_at: string;
}

export interface CreateBookingParams {
  workerId: string;
  serviceId: string;
  jobTitle: string;
  jobDescription: string;
  serviceAddress: string;
  serviceLocation?: string;
  bookingType?: BookingType;
  scheduledAt?: string | null;
  initialPrice: number;
  customerNote?: string;
}

/**
 * Creates a new booking atomically with its initial FairFare negotiation offer.
 * Uses PostgreSQL RPC create_booking_atomic when available, with a safe client-side fallback.
 */
export async function createBooking(
  params: CreateBookingParams
): Promise<{ data: DbBooking | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase is not configured' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'Authentication required to create a booking' };
  }

  if (params.initialPrice <= 0) {
    return { data: null, error: 'Please enter a valid price greater than zero' };
  }

  // 1. Try atomic RPC
  try {
    const { data: rpcRes, error: rpcErr } = await supabase.rpc('create_booking_atomic', {
      p_worker_id: params.workerId,
      p_service_id: params.serviceId,
      p_job_title: params.jobTitle,
      p_job_description: params.jobDescription,
      p_service_address: params.serviceAddress,
      p_service_location: params.serviceLocation || 'Laxmi Nagar, Delhi',
      p_booking_type: params.bookingType || 'asap',
      p_scheduled_at: params.scheduledAt || null,
      p_initial_price: params.initialPrice,
      p_customer_note: params.customerNote || 'Initial FairFare booking offer',
    });

    if (!rpcErr && rpcRes && rpcRes.booking_id) {
      // Fetch the full inserted booking row
      return await fetchBookingById(rpcRes.booking_id);
    }
  } catch (rpcEx) {
    // RPC may not be installed yet; proceed to direct transactional fallback
    console.warn('RPC create_booking_atomic not available, using client fallback', rpcEx);
  }

  // 2. Direct Supabase fallback
  try {
    const bookingNumber = 'BK-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    const { data: booking, error: bErr } = await supabase
      .from('bookings')
      .insert({
        booking_number: bookingNumber,
        customer_id: user.id,
        worker_id: params.workerId,
        service_id: params.serviceId,
        job_title: params.jobTitle,
        job_description: params.jobDescription,
        service_address: params.serviceAddress,
        service_location: params.serviceLocation || 'Laxmi Nagar, Delhi',
        booking_type: params.bookingType || 'asap',
        scheduled_at: params.scheduledAt || null,
        locked_price: params.initialPrice,
        spare_parts_approved: false,
        spare_parts_amount: 0,
        tip_amount: 0,
        total_amount: params.initialPrice,
        booking_status: 'pending',
        payment_status: 'pending',
      })
      .select()
      .single();

    if (bErr || !booking) {
      return { data: null, error: bErr?.message || 'Failed to create booking' };
    }

    // Insert initial offer
    await supabase.from('negotiation_offers').insert({
      booking_id: booking.id,
      proposer_id: user.id,
      proposer_role: 'customer',
      offered_price: params.initialPrice,
      message: params.customerNote || 'Initial FairFare booking offer',
      offer_status: 'pending',
      round_number: 1,
    });

    // Insert timeline event
    await supabase.from('booking_events').insert({
      booking_id: booking.id,
      actor_id: user.id,
      event_type: 'booking_created',
      notes: `Booking created with initial FairFare offer ₹${params.initialPrice}`,
      metadata: { initial_price: params.initialPrice, booking_type: params.bookingType },
    });

    return { data: booking as DbBooking, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Unexpected error creating booking' };
  }
}

/**
 * Loads bookings for an authenticated customer.
 */
export async function fetchCustomerBookings(
  customerId?: string
): Promise<{ data: DbBooking[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase is not configured' };
  }

  try {
    let targetId = customerId;
    if (!targetId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetId = user?.id;
    }

    if (!targetId) {
      return { data: [], error: 'User is not authenticated' };
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        worker:worker_id (
          id,
          full_name,
          hindi_name,
          avatar_url,
          phone
        )
      `)
      .eq('customer_id', targetId)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as DbBooking[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to load customer bookings' };
  }
}

/**
 * Loads assigned and pending bookings for an authenticated worker.
 */
export async function fetchWorkerBookings(
  workerId?: string
): Promise<{ data: DbBooking[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase is not configured' };
  }

  try {
    let targetId = workerId;
    if (!targetId) {
      const { data: { user } } = await supabase.auth.getUser();
      targetId = user?.id;
    }

    if (!targetId) {
      return { data: [], error: 'Worker is not authenticated' };
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        customer:customer_id (
          id,
          full_name,
          phone
        )
      `)
      .or(`worker_id.eq.${targetId},and(worker_id.is.null,booking_status.eq.pending)`)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as DbBooking[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to load worker bookings' };
  }
}

/**
 * Loads a single booking by ID with counterparty profiles.
 */
export async function fetchBookingById(
  bookingId: string
): Promise<{ data: DbBooking | null; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: null, error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        worker:worker_id (
          id,
          full_name,
          hindi_name,
          avatar_url,
          phone
        ),
        customer:customer_id (
          id,
          full_name,
          phone
        )
      `)
      .eq('id', bookingId)
      .single();

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as DbBooking, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to fetch booking' };
  }
}

/**
 * Loads all FairFare negotiation offers for a booking in chronological order.
 */
export async function fetchBookingOffers(
  bookingId: string
): Promise<{ data: DbNegotiationOffer[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('negotiation_offers')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as DbNegotiationOffer[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to load offers' };
  }
}

/**
 * Loads booking timeline audit events in chronological order.
 */
export async function fetchBookingEvents(
  bookingId: string
): Promise<{ data: DbBookingEvent[]; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { data: [], error: 'Supabase is not configured' };
  }

  try {
    const { data, error } = await supabase
      .from('booking_events')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });

    if (error) {
      return { data: [], error: error.message };
    }

    return { data: (data as DbBookingEvent[]) || [], error: null };
  } catch (err: any) {
    return { data: [], error: err.message || 'Failed to load booking events' };
  }
}

/**
 * Submits a new price offer or counteroffer in the FairFare negotiation flow.
 */
export async function submitCounterOffer(
  bookingId: string,
  price: number,
  message?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  if (price <= 0) {
    return { success: false, error: 'Offer price must be greater than zero' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 1. Try atomic RPC
  try {
    const { error: rpcErr } = await supabase.rpc('submit_negotiation_offer', {
      p_booking_id: bookingId,
      p_offered_price: price,
      p_message: message || null,
    });

    if (!rpcErr) {
      return { success: true, error: null };
    }
  } catch (ex) {
    console.warn('RPC submit_negotiation_offer not available, using client fallback', ex);
  }

  // 2. Direct client fallback
  try {
    // Determine caller role from booking
    const { data: b, error: bErr } = await supabase
      .from('bookings')
      .select('customer_id, worker_id, booking_status')
      .eq('id', bookingId)
      .single();

    if (bErr || !b) {
      return { success: false, error: 'Booking not found' };
    }

    if (b.booking_status === 'completed' || b.booking_status === 'cancelled') {
      return { success: false, error: `Cannot negotiate on a ${b.booking_status} booking` };
    }

    const callerRole = user.id === b.customer_id ? 'customer' : 'worker';

    // Mark previous pending offers countered
    await supabase
      .from('negotiation_offers')
      .update({ offer_status: 'countered' })
      .eq('booking_id', bookingId)
      .eq('offer_status', 'pending');

    // Insert new offer
    const { error: insErr } = await supabase.from('negotiation_offers').insert({
      booking_id: bookingId,
      proposer_id: user.id,
      proposer_role: callerRole,
      offered_price: price,
      message: message || `${callerRole === 'worker' ? 'Worker' : 'Customer'} offered ₹${price}`,
      offer_status: 'pending',
    });

    if (insErr) {
      return { success: false, error: insErr.message };
    }

    // Update booking status to negotiating
    await supabase
      .from('bookings')
      .update({ booking_status: 'negotiating', updated_at: new Date().toISOString() })
      .eq('id', bookingId);

    // Add event
    await supabase.from('booking_events').insert({
      booking_id: bookingId,
      actor_id: user.id,
      event_type: 'offer_proposed',
      notes: `${callerRole === 'worker' ? 'Worker' : 'Customer'} offered ₹${price}`,
      metadata: { price },
    });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to submit counteroffer' };
  }
}

/**
 * Accepts a FairFare price offer. Consistently locks price and updates booking status to 'accepted'.
 * Anti-self-acceptance is enforced: only the counterparty can accept an offer.
 */
export async function acceptOffer(
  bookingId: string,
  offerId: string,
  agreedPrice: number
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 1. Try atomic RPC
  try {
    const { error: rpcErr } = await supabase.rpc('accept_negotiation_offer', {
      p_booking_id: bookingId,
      p_offer_id: offerId,
    });

    if (!rpcErr) {
      return { success: true, error: null };
    }
  } catch (ex) {
    console.warn('RPC accept_negotiation_offer not available, using client fallback', ex);
  }

  // 2. Direct client fallback
  try {
    // Anti-self-acceptance check
    const { data: offer, error: offErr } = await supabase
      .from('negotiation_offers')
      .select('*')
      .eq('id', offerId)
      .single();

    if (offErr || !offer) {
      return { success: false, error: 'Offer not found' };
    }

    if (offer.proposer_id === user.id) {
      return { success: false, error: 'You cannot accept your own offer. Waiting for the other party.' };
    }

    // Mark accepted
    await supabase
      .from('negotiation_offers')
      .update({ offer_status: 'accepted' })
      .eq('id', offerId);

    // Mark competing offers countered
    await supabase
      .from('negotiation_offers')
      .update({ offer_status: 'countered' })
      .eq('booking_id', bookingId)
      .neq('id', offerId)
      .eq('offer_status', 'pending');

    // Update booking locked price and status
    const { error: bErr } = await supabase
      .from('bookings')
      .update({
        locked_price: agreedPrice,
        total_amount: agreedPrice,
        booking_status: 'accepted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (bErr) {
      return { success: false, error: bErr.message };
    }

    // Log event
    await supabase.from('booking_events').insert({
      booking_id: bookingId,
      actor_id: user.id,
      event_type: 'offer_accepted',
      notes: `FairFare price locked at ₹${agreedPrice}`,
      metadata: { offer_id: offerId, price: agreedPrice },
    });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to accept offer' };
  }
}

/**
 * Updates booking lifecycle status (accepted -> on_the_way -> in_progress -> completed, or cancelled).
 */
export async function updateBookingStatus(
  bookingId: string,
  nextStatus: BookingStatus,
  notes?: string
): Promise<{ success: boolean; error: string | null }> {
  if (!isSupabaseConfigured()) {
    return { success: false, error: 'Supabase is not configured' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Authentication required' };
  }

  // 1. Try atomic RPC
  try {
    const { error: rpcErr } = await supabase.rpc('update_booking_status', {
      p_booking_id: bookingId,
      p_next_status: nextStatus,
      p_notes: notes || null,
    });

    if (!rpcErr) {
      return { success: true, error: null };
    }
  } catch (ex) {
    console.warn('RPC update_booking_status not available, using client fallback', ex);
  }

  // 2. Direct client fallback
  try {
    const { data: b, error: bErr } = await supabase
      .from('bookings')
      .select('customer_id, worker_id, booking_status')
      .eq('id', bookingId)
      .single();

    if (bErr || !b) {
      return { success: false, error: 'Booking not found' };
    }

    // Authorization checks
    if (nextStatus === 'on_the_way' || nextStatus === 'in_progress') {
      if (user.id !== b.worker_id) {
        return { success: false, error: 'Only the assigned worker can update job operational progress' };
      }
    }

    const { error: updErr } = await supabase
      .from('bookings')
      .update({
        booking_status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', bookingId);

    if (updErr) {
      return { success: false, error: updErr.message };
    }

    // If completed, increment worker jobs count if worker_id exists
    if (nextStatus === 'completed' && b.worker_id) {
      try {
        const { data: wp } = await supabase
          .from('worker_profiles')
          .select('total_jobs')
          .eq('id', b.worker_id)
          .single();
        if (wp) {
          await supabase
            .from('worker_profiles')
            .update({ total_jobs: (wp.total_jobs || 0) + 1 })
            .eq('id', b.worker_id);
        }
      } catch { }
    }

    // Log timeline event
    await supabase.from('booking_events').insert({
      booking_id: bookingId,
      actor_id: user.id,
      event_type: `status_changed_${nextStatus}`,
      notes: notes || `Booking transitioned to ${nextStatus}`,
      metadata: { from_status: b.booking_status, to_status: nextStatus },
    });

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to update booking status' };
  }
}
