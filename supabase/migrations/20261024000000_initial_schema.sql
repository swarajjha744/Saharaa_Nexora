-- ====================================================================
-- SAHARAA HYPERLOCAL PLATFORM — REVISED DATABASE SCHEMA & RLS MIGRATION
-- Migration Version: 20261024000000_initial_schema.sql
-- Environment: Supabase PostgreSQL with Strict Privacy & Row Level Security
-- ====================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('customer', 'worker', 'admin');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE preferred_language AS ENUM ('en', 'hi');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('pending', 'in_review', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE booking_type AS ENUM ('asap', 'schedule');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE booking_status AS ENUM (
    'pending',
    'negotiating',
    'accepted',
    'on_the_way',
    'in_progress',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_status AS ENUM (
    'pending',
    'authorized',
    'paid',
    'refunded',
    'disputed'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE payment_method AS ENUM ('upi', 'cash', 'card', 'wallet');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE offer_status AS ENUM ('pending', 'countered', 'accepted', 'rejected', 'expired');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE actor_role AS ENUM ('customer', 'worker', 'system');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE verification_doc_type AS ENUM ('aadhaar', 'address_proof', 'skill_certificate', 'police_verification');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE report_category AS ENUM (
    'late_arrival',
    'price_dispute',
    'work_quality',
    'safety_sos',
    'behaviour',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE report_status AS ENUM ('open', 'under_review', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- ====================================================================
-- 3. CORE TABLES
-- ====================================================================

-- A. PROFILES (Private account data: phone, language, role)
-- NOTE: Never made publicly readable. Public discovery uses marketplace_workers view.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'customer',
  phone TEXT,
  preferred_language preferred_language NOT NULL DEFAULT 'en',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- B. SERVICES (Public Platform Service Catalog)
CREATE TABLE IF NOT EXISTS public.services (
  id TEXT PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_hi TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT NOT NULL,
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price > 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- C. WORKER PROFILES (Marketplace skill & trust attributes)
CREATE TABLE IF NOT EXISTS public.worker_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  hindi_name TEXT,
  primary_service_id TEXT REFERENCES public.services(id) ON DELETE SET NULL,
  skills TEXT[] NOT NULL DEFAULT '{}',
  experience_years INTEGER NOT NULL DEFAULT 1 CHECK (experience_years >= 0),
  starting_rate NUMERIC(10, 2) NOT NULL DEFAULT 199.00 CHECK (starting_rate > 0),
  is_online BOOLEAN NOT NULL DEFAULT false,
  is_available_now BOOLEAN NOT NULL DEFAULT false,
  service_radius_km NUMERIC(5, 2) NOT NULL DEFAULT 3.0 CHECK (service_radius_km > 0),
  service_area TEXT NOT NULL DEFAULT 'Laxmi Nagar, Delhi',
  about TEXT,
  response_mins INTEGER NOT NULL DEFAULT 5 CHECK (response_mins > 0),
  trust_dna INTEGER DEFAULT NULL CHECK (trust_dna IS NULL OR (trust_dna >= 0 AND trust_dna <= 100)),
  verification_status verification_status NOT NULL DEFAULT 'pending',
  rating NUMERIC(3, 2) DEFAULT NULL CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5.00)),
  total_jobs INTEGER NOT NULL DEFAULT 0 CHECK (total_jobs >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- D. BOOKINGS (Private between customer, worker, and admin)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  worker_id UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  service_id TEXT NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  job_title TEXT NOT NULL,
  job_description TEXT NOT NULL,
  service_address TEXT NOT NULL,
  service_location TEXT NOT NULL DEFAULT 'Laxmi Nagar, Delhi',
  booking_type booking_type NOT NULL DEFAULT 'asap',
  scheduled_at TIMESTAMPTZ,
  locked_price NUMERIC(10, 2) NOT NULL CHECK (locked_price >= 0),
  spare_parts_approved BOOLEAN NOT NULL DEFAULT false,
  spare_parts_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (spare_parts_amount >= 0),
  tip_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tip_amount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  booking_status booking_status NOT NULL DEFAULT 'pending',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- E. NEGOTIATION OFFERS (FairFare Transparent Counter-Offers)
CREATE TABLE IF NOT EXISTS public.negotiation_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  proposer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  proposer_role actor_role NOT NULL,
  offered_price NUMERIC(10, 2) NOT NULL CHECK (offered_price >= 0),
  message TEXT,
  offer_status offer_status NOT NULL DEFAULT 'pending',
  previous_offer_id UUID REFERENCES public.negotiation_offers(id) ON DELETE SET NULL,
  round_number INTEGER NOT NULL DEFAULT 1 CHECK (round_number >= 1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- F. BOOKING EVENTS (Status audit timeline & emergency tracking)
CREATE TABLE IF NOT EXISTS public.booking_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- G. REVIEWS (Authentic post-job ratings — Publicly viewable, no phone numbers)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES public.bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  is_verified_booking BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- H. PAYMENTS (Transparent Fee Split & Tip Protection — Client Tamper-Proof)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
  tip_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (tip_amount >= 0),
  worker_payout_amount NUMERIC(10, 2) NOT NULL CHECK (worker_payout_amount >= 0),
  platform_fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00 CHECK (platform_fee_amount >= 0),
  payment_method payment_method NOT NULL DEFAULT 'upi',
  payment_status payment_status NOT NULL DEFAULT 'pending',
  provider_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- I. VERIFICATION RECORDS (Worker Identity & TrustDNA — Private Documents)
CREATE TABLE IF NOT EXISTS public.verification_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  verification_type verification_doc_type NOT NULL,
  status verification_status NOT NULL DEFAULT 'pending',
  document_storage_path TEXT NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- J. REPORTS AND DISPUTES (Trust & Safety — Private to Parties & Admins)
CREATE TABLE IF NOT EXISTS public.reports_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  accused_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category report_category NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status report_status NOT NULL DEFAULT 'open',
  resolution_notes TEXT,
  resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ====================================================================
-- 4. PERFORMANCE & LOOKUP INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_service ON public.worker_profiles(primary_service_id);
CREATE INDEX IF NOT EXISTS idx_worker_profiles_online ON public.worker_profiles(is_online, is_available_now);
CREATE INDEX IF NOT EXISTS idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_worker ON public.bookings(worker_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(booking_status);
CREATE INDEX IF NOT EXISTS idx_offers_booking ON public.negotiation_offers(booking_id);
CREATE INDEX IF NOT EXISTS idx_events_booking ON public.booking_events(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_worker ON public.reviews(worker_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_verification_worker ON public.verification_records(worker_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports_disputes(status);

-- ====================================================================
-- 5. SECURE REPUTATION & SEARCH-PATH HARDENED FUNCTIONS
-- ====================================================================

-- Safe Administrator Check (SECURITY DEFINER with fixed search_path to prevent hijacking)
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'admin'
  );
$$;

-- Trigger: auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Anti-Privilege Escalation: Strictly prevent users from elevating role to admin
CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.role = 'admin' THEN
      IF NOT (
        coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
        coalesce(current_setting('saharaa.allow_role_change', true), '') = 'true' OR
        public.is_admin(auth.uid())
      ) THEN
        RAISE EXCEPTION 'Privilege escalation violation: Direct insertion of administrator profiles is forbidden.';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.role <> OLD.role THEN
      IF NOT (
        coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
        coalesce(current_setting('saharaa.allow_role_change', true), '') = 'true' OR
        public.is_admin(auth.uid())
      ) THEN
        RAISE EXCEPTION 'Privilege escalation violation: Only platform administrators can change user roles.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Privileged Procedure: Safe Admin Provisioning (First Admin Bootstrap / Authorized DB Admin Setup)
-- Can only be executed by database superuser (postgres, supabase_admin), service_role,
-- or during initial platform bootstrap when zero admins exist.
CREATE OR REPLACE FUNCTION public.provision_admin_user(target_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT (
    session_user IN ('postgres', 'supabase_admin') OR
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
    NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin')
  ) THEN
    RAISE EXCEPTION 'Unauthorized: provision_admin_user can only be executed by database administrators or during initial platform bootstrap.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = target_user_id) THEN
    RAISE EXCEPTION 'User profile with ID % does not exist.', target_user_id;
  END IF;

  -- Set transaction-local configuration flag to signal prevent_role_escalation trigger that this is authorized
  PERFORM set_config('saharaa.allow_role_change', 'true', true);

  UPDATE public.profiles
  SET role = 'admin'
  WHERE id = target_user_id;

  PERFORM set_config('saharaa.allow_role_change', 'false', true);
END;
$$;

-- Privileged Procedure: Helper to provision admin by email lookup from auth.users
CREATE OR REPLACE FUNCTION public.provision_admin_by_email(target_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = lower(trim(target_email));

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email "%" not found in auth.users.', target_email;
  END IF;

  PERFORM public.provision_admin_user(v_user_id);
  RETURN v_user_id;
END;
$$;

-- Anti-Privilege Escalation: Strictly prevent workers from altering TrustDNA, ratings, jobs, or verification status
CREATE OR REPLACE FUNCTION public.prevent_worker_metric_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Ensure newly inserted worker records have no artificial trust scores or self-assigned ratings:
    -- trust_dna and rating must be NULL (unavailable until genuine data/reviews exist),
    -- verification_status must be 'pending', and total_jobs must be 0.
    IF (NEW.trust_dna IS NOT NULL OR NEW.rating IS NOT NULL OR NEW.verification_status <> 'pending' OR NEW.total_jobs <> 0) THEN
      IF NOT (
        coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
        public.is_admin(auth.uid())
      ) THEN
        RAISE EXCEPTION 'Security violation: New worker profiles cannot self-assign verification status, ratings, or trust metrics.';
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF (
      (NEW.trust_dna IS DISTINCT FROM OLD.trust_dna) OR
      (NEW.verification_status IS DISTINCT FROM OLD.verification_status) OR
      (NEW.rating IS DISTINCT FROM OLD.rating) OR
      (NEW.total_jobs IS DISTINCT FROM OLD.total_jobs)
    ) THEN
      IF NOT (
        coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' OR
        public.is_admin(auth.uid())
      ) THEN
        RAISE EXCEPTION 'Security violation: TrustDNA, rating, jobs count, and verification status cannot be manually altered.';
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger: Safe user profile creation upon Supabase Auth sign-up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, phone, preferred_language, avatar_url)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data->>'full_name', 'Saharaa User'),
    CASE 
      WHEN NEW.raw_user_meta_data->>'role' = 'worker' THEN 'worker'::user_role
      ELSE 'customer'::user_role -- Never allow raw client metadata to grant admin role
    END,
    NEW.phone,
    coalesce((NEW.raw_user_meta_data->>'preferred_language')::preferred_language, 'en'::preferred_language),
    NEW.raw_user_meta_data->>'avatar_url'
  );

  IF (NEW.raw_user_meta_data->>'role' = 'worker') THEN
    INSERT INTO public.worker_profiles (id, primary_service_id, starting_rate)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'primary_service_id',
      coalesce((NEW.raw_user_meta_data->>'starting_rate')::numeric, 199.00)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Restrict function execution permissions to safe roles
REVOKE ALL ON FUNCTION public.prevent_role_escalation() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.prevent_worker_metric_tampering() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_admin_user(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_admin_by_email(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin(UUID) TO authenticated;

-- ====================================================================
-- 6. ATTACH TRIGGERS
-- ====================================================================
DROP TRIGGER IF EXISTS on_profiles_updated_at ON public.profiles;
CREATE TRIGGER on_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_worker_profiles_updated_at ON public.worker_profiles;
CREATE TRIGGER on_worker_profiles_updated_at
  BEFORE UPDATE ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_bookings_updated_at ON public.bookings;
CREATE TRIGGER on_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_verification_records_updated_at ON public.verification_records;
CREATE TRIGGER on_verification_records_updated_at
  BEFORE UPDATE ON public.verification_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS on_reports_disputes_updated_at ON public.reports_disputes;
CREATE TRIGGER on_reports_disputes_updated_at
  BEFORE UPDATE ON public.reports_disputes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS enforce_no_role_escalation ON public.profiles;
CREATE TRIGGER enforce_no_role_escalation
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

DROP TRIGGER IF EXISTS enforce_no_worker_metric_tampering ON public.worker_profiles;
CREATE TRIGGER enforce_no_worker_metric_tampering
  BEFORE INSERT OR UPDATE ON public.worker_profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_worker_metric_tampering();

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- 7. PUBLIC DISCOVERY VIEW (Deliberately Restricted Public Projection)
-- ====================================================================
-- SECURITY MODEL:
-- 1. Defined with security_barrier = true.
-- 2. Projects ONLY non-sensitive, marketplace-approved columns.
-- 3. Excludes personal phone numbers, emails, addresses, and internal audit fields.
-- 4. ELIGIBILITY: ONLY workers with verification_status = 'verified' and role = 'worker' are included.
--    Pending, in-review, or rejected workers CANNOT become discoverable merely by setting is_online = true.
-- 5. Availability (is_online, is_available_now) is projected as state for filtering (ASAP vs scheduled),
--    strictly decoupled from verification eligibility.
CREATE OR REPLACE VIEW public.marketplace_workers
WITH (security_barrier = true) AS
  SELECT 
    wp.id,
    p.full_name,
    wp.hindi_name,
    p.avatar_url,
    wp.primary_service_id,
    wp.skills,
    wp.experience_years,
    wp.starting_rate,
    wp.is_online,
    wp.is_available_now,
    wp.service_radius_km,
    wp.service_area,
    wp.about,
    wp.response_mins,
    wp.trust_dna,
    wp.verification_status,
    wp.rating,
    wp.total_jobs
  FROM public.worker_profiles wp
  JOIN public.profiles p ON p.id = wp.id
  WHERE wp.verification_status = 'verified'
    AND p.role = 'worker';

-- Grant public read access to marketplace discovery view
GRANT SELECT ON public.marketplace_workers TO anon, authenticated;

-- ====================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.worker_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.negotiation_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports_disputes ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------------------------------
-- A. PROFILES POLICIES (Privacy Hardened: No Public Phone Leaks)
-- --------------------------------------------------------------------

-- 1. Users can view their own profile
CREATE POLICY "Users can view their own private profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- 2. Genuine administrators can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin(auth.uid()));

-- 3. Authorized counterparties in an active booking can view each other's profile
CREATE POLICY "Authorized booking counterparties can view profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE (b.customer_id = auth.uid() AND b.worker_id = profiles.id)
         OR (b.worker_id = auth.uid() AND b.customer_id = profiles.id)
    )
  );

-- 4. Users can only update their own profile (role elevation blocked by trigger)
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- --------------------------------------------------------------------
-- B. SERVICES POLICIES (Read-Only Public Catalog)
-- --------------------------------------------------------------------
CREATE POLICY "Active services catalog is viewable by everyone"
  ON public.services FOR SELECT
  USING (is_active = true OR public.is_admin(auth.uid()));

CREATE POLICY "Admins can manage services catalog"
  ON public.services FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- --------------------------------------------------------------------
-- C. WORKER PROFILES POLICIES
-- --------------------------------------------------------------------
-- Authenticated users and discovery view can read worker marketplace attributes
CREATE POLICY "Worker profiles are viewable for discovery"
  ON public.worker_profiles FOR SELECT
  USING (true);

-- Workers can update their own operational settings (metrics blocked by trigger)
CREATE POLICY "Workers can update own operational profile"
  ON public.worker_profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Workers can register their own worker profile"
  ON public.worker_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can manage worker profiles"
  ON public.worker_profiles FOR ALL
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- --------------------------------------------------------------------
-- D. BOOKINGS POLICIES (Strict Access: No Anonymous Access)
-- --------------------------------------------------------------------
-- Customers view their own bookings; workers view assigned or open pending requests in their area
CREATE POLICY "Parties and admins can view relevant bookings"
  ON public.bookings FOR SELECT
  USING (
    auth.uid() = customer_id OR
    auth.uid() = worker_id OR
    (
      worker_id IS NULL AND 
      booking_status = 'pending' AND 
      EXISTS (SELECT 1 FROM public.worker_profiles wp WHERE wp.id = auth.uid() AND wp.is_online = true)
    ) OR
    public.is_admin(auth.uid())
  );

-- Customers can create bookings for themselves
CREATE POLICY "Customers can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

-- Involved parties can update authorized booking fields
CREATE POLICY "Involved parties can update authorized booking fields"
  ON public.bookings FOR UPDATE
  USING (
    auth.uid() = customer_id OR
    auth.uid() = worker_id OR
    public.is_admin(auth.uid())
  )
  WITH CHECK (
    auth.uid() = customer_id OR
    auth.uid() = worker_id OR
    public.is_admin(auth.uid())
  );

-- --------------------------------------------------------------------
-- E. NEGOTIATION OFFERS POLICIES (FairFare Privacy)
-- --------------------------------------------------------------------
-- Only customer, assigned worker, or admin can read offers for a booking
CREATE POLICY "Involved parties can view negotiation offers"
  ON public.negotiation_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = negotiation_offers.booking_id
        AND (b.customer_id = auth.uid() OR b.worker_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

-- Only customer or assigned worker can insert an offer with their own proposer_id
CREATE POLICY "Involved parties can propose negotiation offers"
  ON public.negotiation_offers FOR INSERT
  WITH CHECK (
    auth.uid() = proposer_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = negotiation_offers.booking_id
        AND (b.customer_id = auth.uid() OR b.worker_id = auth.uid())
    )
  );

-- --------------------------------------------------------------------
-- F. BOOKING EVENTS POLICIES
-- --------------------------------------------------------------------
CREATE POLICY "Involved parties can view booking timeline events"
  ON public.booking_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_events.booking_id
        AND (b.customer_id = auth.uid() OR b.worker_id = auth.uid() OR public.is_admin(auth.uid()))
    )
  );

CREATE POLICY "Involved parties can log booking events"
  ON public.booking_events FOR INSERT
  WITH CHECK (
    auth.uid() = actor_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_events.booking_id
        AND (b.customer_id = auth.uid() OR b.worker_id = auth.uid())
    )
  );

-- --------------------------------------------------------------------
-- G. REVIEWS POLICIES
-- --------------------------------------------------------------------
-- Public reviews contain no phone numbers or private addresses
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT
  USING (true);

-- Only the customer of a COMPLETED booking can leave a review
CREATE POLICY "Customers of completed bookings can create reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (
    auth.uid() = customer_id AND
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = reviews.booking_id
        AND b.customer_id = auth.uid()
        AND b.booking_status = 'completed'
    )
  );

-- --------------------------------------------------------------------
-- H. PAYMENTS POLICIES (Client Tamper-Proof)
-- --------------------------------------------------------------------
-- Parties can view payment records for their own bookings only
CREATE POLICY "Involved parties can view payment records"
  ON public.payments FOR SELECT
  USING (
    auth.uid() = customer_id OR
    auth.uid() = worker_id OR
    public.is_admin(auth.uid())
  );

-- Direct client modifications blocked; only service role or genuine admins
CREATE POLICY "Payment mutations require administrative authority"
  ON public.payments FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid()) OR
    coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role'
  );

-- --------------------------------------------------------------------
-- I. VERIFICATION RECORDS POLICIES (Sensitive Documents Kept Private)
-- --------------------------------------------------------------------
-- Only the worker who owns the document and admins can see it
CREATE POLICY "Workers and admins can view verification records"
  ON public.verification_records FOR SELECT
  USING (
    auth.uid() = worker_id OR
    public.is_admin(auth.uid())
  );

-- Workers can upload their own verification documents with 'pending' status
CREATE POLICY "Workers can upload verification documents"
  ON public.verification_records FOR INSERT
  WITH CHECK (
    auth.uid() = worker_id AND
    status = 'pending'
  );

-- Only admins can review/approve/reject verification records
CREATE POLICY "Admins can review verification records"
  ON public.verification_records FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- --------------------------------------------------------------------
-- J. REPORTS AND DISPUTES POLICIES
-- --------------------------------------------------------------------
-- Users can view reports they submitted or are accused in; admins see all
CREATE POLICY "Users can view relevant reports"
  ON public.reports_disputes FOR SELECT
  USING (
    auth.uid() = reporter_id OR
    auth.uid() = accused_id OR
    public.is_admin(auth.uid())
  );

-- Any authenticated user can submit a report or safety escalation
CREATE POLICY "Users can submit reports"
  ON public.reports_disputes FOR INSERT
  WITH CHECK (auth.uid() = reporter_id);

-- Only admins can update status and resolution notes
CREATE POLICY "Admins can resolve reports"
  ON public.reports_disputes FOR UPDATE
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- ====================================================================
-- 9. INITIAL SEED DATA (Services Catalog Only — No Fake Workers)
-- ====================================================================
INSERT INTO public.services (id, name_en, name_hi, icon, description, base_price, is_active)
VALUES
  ('plumbing', 'Plumbing', 'प्लंबिंग', 'wrench', 'Leaks, taps, tanks & fittings', 199.00, true),
  ('electrical', 'Electrical', 'बिजली', 'zap', 'Switches, wiring & fans', 179.00, true),
  ('cleaning', 'Home Cleaning', 'सफ़ाई', 'sparkles', 'Deep & regular cleaning', 499.00, true),
  ('painting', 'Painting', 'पेंटिंग', 'paint', 'Rooms, walls & touch-ups', 899.00, true),
  ('cooking', 'Cooking', 'खाना', 'chef', 'Daily meals & events', 349.00, true),
  ('appliance', 'Appliance Repair', 'उपकरण मरम्मत', 'fridge', 'AC, fridge, washer & more', 249.00, true),
  ('carpentry', 'Carpentry', 'बढ़ई', 'hammer', 'Furniture & fittings', 299.00, true),
  ('gardening', 'Gardening', 'बागवानी', 'leaf', 'Plants, lawns & balconies', 249.00, true)
ON CONFLICT (id) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_hi = EXCLUDED.name_hi,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  is_active = EXCLUDED.is_active;

-- ====================================================================
-- 10. DEFENSE-IN-DEPTH PRIVILEGES & GRANTS
-- ====================================================================
-- RLS alone is not sufficient if excessive privileges are granted to roles.
-- We explicitly revoke all table-level access from `anon` on sensitive tables,
-- granting SELECT only to the public catalog, public reviews, and the safe view.

-- A. Schema Usage
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- B. Revoke default access on sensitive tables from anonymous users
REVOKE ALL ON TABLE public.profiles FROM anon;
REVOKE ALL ON TABLE public.worker_profiles FROM anon;
REVOKE ALL ON TABLE public.bookings FROM anon;
REVOKE ALL ON TABLE public.negotiation_offers FROM anon;
REVOKE ALL ON TABLE public.booking_events FROM anon;
REVOKE ALL ON TABLE public.payments FROM anon;
REVOKE ALL ON TABLE public.verification_records FROM anon;
REVOKE ALL ON TABLE public.reports_disputes FROM anon;

-- C. Anonymous User Grants (Strictly Public Projections Only)
GRANT SELECT ON TABLE public.services TO anon;
GRANT SELECT ON TABLE public.reviews TO anon;
GRANT SELECT ON TABLE public.marketplace_workers TO anon;

-- D. Authenticated User Grants (Subject to Row Level Security)
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.worker_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.bookings TO authenticated;
GRANT SELECT, INSERT ON TABLE public.negotiation_offers TO authenticated;
GRANT SELECT, INSERT ON TABLE public.booking_events TO authenticated;
GRANT SELECT, INSERT ON TABLE public.services TO authenticated;
GRANT SELECT, INSERT ON TABLE public.reviews TO authenticated;
GRANT SELECT ON TABLE public.payments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.verification_records TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.reports_disputes TO authenticated;
GRANT SELECT ON TABLE public.marketplace_workers TO authenticated;

-- E. Function Execution Privileges (Protect Security Definer Functions)
REVOKE EXECUTE ON FUNCTION public.prevent_role_escalation() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.prevent_worker_metric_tampering() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.provision_admin_user(UUID) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.provision_admin_by_email(TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_admin_user(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.provision_admin_by_email(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
