-- ====================================================================
-- SAHARAA — GROUP 4 MIGRATION: ATOMIC BOOKINGS, FAIRFARE NEGOTIATION & STATUSES
-- File: supabase/migrations/20261024000001_booking_negotiation_rpc.sql
-- ====================================================================

-- 1. Ensure involved parties have explicit UPDATE permission on negotiation_offers
DO $$ BEGIN
  CREATE POLICY "Involved parties can update negotiation offers"
    ON public.negotiation_offers FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = negotiation_offers.booking_id
          AND (b.customer_id = auth.uid() OR b.worker_id = auth.uid() OR public.is_admin(auth.uid()))
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.bookings b
        WHERE b.id = negotiation_offers.booking_id
          AND (b.customer_id = auth.uid() OR b.worker_id = auth.uid() OR public.is_admin(auth.uid()))
      )
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Atomic booking creation with initial FairFare offer & timeline event
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_worker_id UUID,
  p_service_id TEXT,
  p_job_title TEXT,
  p_job_description TEXT,
  p_service_address TEXT,
  p_service_location TEXT DEFAULT 'Laxmi Nagar, Delhi',
  p_booking_type booking_type DEFAULT 'asap',
  p_scheduled_at TIMESTAMPTZ DEFAULT NULL,
  p_initial_price NUMERIC DEFAULT 0,
  p_customer_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_customer_id UUID;
  v_booking_id UUID;
  v_booking_number TEXT;
  v_offer_id UUID;
  v_service_exists BOOLEAN;
  v_result JSONB;
BEGIN
  v_customer_id := auth.uid();
  IF v_customer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to create a booking';
  END IF;

  -- Validate customer profile
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_customer_id) THEN
    RAISE EXCEPTION 'Customer profile not found';
  END IF;

  -- Validate price
  IF p_initial_price <= 0 THEN
    RAISE EXCEPTION 'Initial proposed price must be greater than zero';
  END IF;

  -- Validate service
  SELECT is_active INTO v_service_exists FROM public.services WHERE id = p_service_id;
  IF v_service_exists IS NOT TRUE THEN
    RAISE EXCEPTION 'Selected service % is invalid or inactive', p_service_id;
  END IF;

  -- Validate worker if specified
  IF p_worker_id IS NOT NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.worker_profiles WHERE id = p_worker_id) THEN
      RAISE EXCEPTION 'Worker profile does not exist';
    END IF;
  END IF;

  -- Generate human-readable booking number
  v_booking_number := 'BK-' || to_char(now(), 'YYYYMMDD') || '-' || upper(substr(md5(random()::text), 1, 6));

  -- Insert booking
  INSERT INTO public.bookings (
    booking_number,
    customer_id,
    worker_id,
    service_id,
    job_title,
    job_description,
    service_address,
    service_location,
    booking_type,
    scheduled_at,
    locked_price,
    spare_parts_approved,
    spare_parts_amount,
    tip_amount,
    total_amount,
    booking_status,
    payment_status,
    created_at,
    updated_at
  ) VALUES (
    v_booking_number,
    v_customer_id,
    p_worker_id,
    p_service_id,
    p_job_title,
    p_job_description,
    p_service_address,
    COALESCE(p_service_location, 'Laxmi Nagar, Delhi'),
    p_booking_type,
    p_scheduled_at,
    p_initial_price,
    false,
    0.00,
    0.00,
    p_initial_price,
    'pending',
    'pending',
    now(),
    now()
  ) RETURNING id INTO v_booking_id;

  -- Insert initial negotiation offer
  INSERT INTO public.negotiation_offers (
    booking_id,
    proposer_id,
    proposer_role,
    offered_price,
    message,
    offer_status,
    round_number,
    created_at
  ) VALUES (
    v_booking_id,
    v_customer_id,
    'customer',
    p_initial_price,
    COALESCE(p_customer_note, 'Initial FairFare booking offer'),
    'pending',
    1,
    now()
  ) RETURNING id INTO v_offer_id;

  -- Insert timeline event
  INSERT INTO public.booking_events (
    booking_id,
    actor_id,
    event_type,
    notes,
    metadata,
    created_at
  ) VALUES (
    v_booking_id,
    v_customer_id,
    'booking_created',
    'Booking created with FairFare initial offer ₹' || p_initial_price::text,
    jsonb_build_object(
      'booking_number', v_booking_number,
      'service_id', p_service_id,
      'initial_price', p_initial_price,
      'booking_type', p_booking_type
    ),
    now()
  );

  SELECT jsonb_build_object(
    'booking_id', v_booking_id,
    'booking_number', v_booking_number,
    'offer_id', v_offer_id,
    'status', 'pending',
    'price', p_initial_price
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3. Atomic offer submission / counteroffer
CREATE OR REPLACE FUNCTION public.submit_negotiation_offer(
  p_booking_id UUID,
  p_offered_price NUMERIC,
  p_message TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_booking RECORD;
  v_caller_role actor_role;
  v_next_round INT;
  v_offer_id UUID;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  IF p_offered_price <= 0 THEN
    RAISE EXCEPTION 'Offered price must be greater than zero';
  END IF;

  -- Lock booking row
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  -- Verify counterparty identity
  IF v_caller_id = v_booking.customer_id THEN
    v_caller_role := 'customer';
  ELSIF v_caller_id = v_booking.worker_id THEN
    v_caller_role := 'worker';
  ELSE
    RAISE EXCEPTION 'Unauthorized: you are not a participant in this booking';
  END IF;

  -- Check terminal state
  IF v_booking.booking_status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot negotiate on a % booking', v_booking.booking_status;
  END IF;

  -- Mark previous pending offers as countered
  UPDATE public.negotiation_offers
  SET offer_status = 'countered'
  WHERE booking_id = p_booking_id
    AND offer_status = 'pending';

  -- Calculate round number
  SELECT COALESCE(MAX(round_number), 0) + 1 INTO v_next_round
  FROM public.negotiation_offers
  WHERE booking_id = p_booking_id;

  -- Insert new offer
  INSERT INTO public.negotiation_offers (
    booking_id,
    proposer_id,
    proposer_role,
    offered_price,
    message,
    offer_status,
    round_number,
    created_at
  ) VALUES (
    p_booking_id,
    v_caller_id,
    v_caller_role,
    p_offered_price,
    COALESCE(p_message, v_caller_role || ' countered with ₹' || p_offered_price::text),
    'pending',
    v_next_round,
    now()
  ) RETURNING id INTO v_offer_id;

  -- Transition booking status to negotiating
  IF v_booking.booking_status = 'pending' THEN
    UPDATE public.bookings
    SET booking_status = 'negotiating',
        updated_at = now()
    WHERE id = p_booking_id;
  END IF;

  -- Log event
  INSERT INTO public.booking_events (
    booking_id,
    actor_id,
    event_type,
    notes,
    metadata,
    created_at
  ) VALUES (
    p_booking_id,
    v_caller_id,
    'offer_proposed',
    v_caller_role || ' proposed ₹' || p_offered_price::text,
    jsonb_build_object('offer_id', v_offer_id, 'price', p_offered_price, 'round', v_next_round),
    now()
  );

  RETURN jsonb_build_object(
    'offer_id', v_offer_id,
    'booking_id', p_booking_id,
    'offered_price', p_offered_price,
    'proposer_role', v_caller_role,
    'round_number', v_next_round,
    'status', 'pending'
  );
END;
$$;

-- 4. Atomic offer acceptance with row-locking
CREATE OR REPLACE FUNCTION public.accept_negotiation_offer(
  p_booking_id UUID,
  p_offer_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_booking RECORD;
  v_offer RECORD;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Lock booking row
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  IF v_booking.booking_status IN ('completed', 'cancelled') THEN
    RAISE EXCEPTION 'Cannot accept offer for % booking', v_booking.booking_status;
  END IF;

  -- Lock offer row
  SELECT * INTO v_offer
  FROM public.negotiation_offers
  WHERE id = p_offer_id AND booking_id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Offer not found for this booking';
  END IF;

  IF v_offer.offer_status != 'pending' THEN
    RAISE EXCEPTION 'Offer is no longer pending (current status: %)', v_offer.offer_status;
  END IF;

  -- Anti-self-acceptance: cannot accept own offer
  IF v_offer.proposer_id = v_caller_id THEN
    RAISE EXCEPTION 'Cannot accept your own offer; waiting for the other party to respond';
  END IF;

  -- Caller must be counterparty
  IF v_caller_id != v_booking.customer_id AND v_caller_id != v_booking.worker_id THEN
    RAISE EXCEPTION 'Unauthorized: only booking counterparties can accept offers';
  END IF;

  -- Mark accepted offer
  UPDATE public.negotiation_offers
  SET offer_status = 'accepted'
  WHERE id = p_offer_id;

  -- Mark competing offers as superseded
  UPDATE public.negotiation_offers
  SET offer_status = 'countered'
  WHERE booking_id = p_booking_id
    AND id != p_offer_id
    AND offer_status = 'pending';

  -- Update booking with locked price, total amount, and accepted status
  UPDATE public.bookings
  SET locked_price = v_offer.offered_price,
      total_amount = v_offer.offered_price + spare_parts_amount + tip_amount,
      booking_status = 'accepted',
      updated_at = now()
  WHERE id = p_booking_id;

  -- Log event
  INSERT INTO public.booking_events (
    booking_id,
    actor_id,
    event_type,
    notes,
    metadata,
    created_at
  ) VALUES (
    p_booking_id,
    v_caller_id,
    'offer_accepted',
    'FairFare price locked at ₹' || v_offer.offered_price::text,
    jsonb_build_object('offer_id', p_offer_id, 'agreed_price', v_offer.offered_price),
    now()
  );

  RETURN jsonb_build_object(
    'booking_id', p_booking_id,
    'locked_price', v_offer.offered_price,
    'booking_status', 'accepted'
  );
END;
$$;

-- 5. Synchronized status transitions
CREATE OR REPLACE FUNCTION public.update_booking_status(
  p_booking_id UUID,
  p_next_status booking_status,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_caller_id UUID;
  v_booking RECORD;
  v_curr_status booking_status;
BEGIN
  v_caller_id := auth.uid();
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = p_booking_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found';
  END IF;

  v_curr_status := v_booking.booking_status;

  -- Check authorized transitions
  IF p_next_status = 'cancelled' THEN
    IF v_curr_status = 'completed' THEN
      RAISE EXCEPTION 'Cannot cancel a completed booking';
    END IF;
    IF v_caller_id != v_booking.customer_id AND v_caller_id != v_booking.worker_id THEN
      RAISE EXCEPTION 'Unauthorized to cancel this booking';
    END IF;

  ELSIF p_next_status = 'on_the_way' THEN
    IF v_caller_id != v_booking.worker_id THEN
      RAISE EXCEPTION 'Only the assigned worker can update status to on_the_way';
    END IF;
    IF v_curr_status != 'accepted' THEN
      RAISE EXCEPTION 'Invalid transition from % to on_the_way (must be accepted first)', v_curr_status;
    END IF;

  ELSIF p_next_status = 'in_progress' THEN
    IF v_caller_id != v_booking.worker_id THEN
      RAISE EXCEPTION 'Only the assigned worker can start work';
    END IF;
    IF v_curr_status != 'on_the_way' AND v_curr_status != 'accepted' THEN
      RAISE EXCEPTION 'Invalid transition from % to in_progress', v_curr_status;
    END IF;

  ELSIF p_next_status = 'completed' THEN
    IF v_caller_id != v_booking.worker_id AND v_caller_id != v_booking.customer_id THEN
      RAISE EXCEPTION 'Unauthorized to mark booking completed';
    END IF;
    IF v_curr_status != 'in_progress' THEN
      RAISE EXCEPTION 'Invalid transition from % to completed (work must be in_progress)', v_curr_status;
    END IF;

    -- Increment completed jobs count
    IF v_booking.worker_id IS NOT NULL THEN
      UPDATE public.worker_profiles
      SET total_jobs = COALESCE(total_jobs, 0) + 1
      WHERE id = v_booking.worker_id;
    END IF;

  ELSE
    RAISE EXCEPTION 'Unsupported status transition to %', p_next_status;
  END IF;

  -- Apply status update
  UPDATE public.bookings
  SET booking_status = p_next_status,
      updated_at = now()
  WHERE id = p_booking_id;

  -- Log event
  INSERT INTO public.booking_events (
    booking_id,
    actor_id,
    event_type,
    notes,
    metadata,
    created_at
  ) VALUES (
    p_booking_id,
    v_caller_id,
    'status_changed_' || p_next_status::text,
    COALESCE(p_notes, 'Status transitioned from ' || v_curr_status::text || ' to ' || p_next_status::text),
    jsonb_build_object('from_status', v_curr_status, 'to_status', p_next_status),
    now()
  );

  RETURN jsonb_build_object(
    'booking_id', p_booking_id,
    'from_status', v_curr_status,
    'to_status', p_next_status
  );
END;
$$;

-- 6. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_booking_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_negotiation_offer TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_negotiation_offer TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_booking_status TO authenticated;
