-- ====================================================================
-- SAHARAA — DATABASE AUTHORIZATION & SECURITY TEST SUITE
-- File: supabase/tests/database_authorization_tests.sql
-- ====================================================================
-- Instructions:
-- Run this script inside a test transaction (`BEGIN; ... ROLLBACK;`) in the
-- Supabase SQL Editor or a staging PostgreSQL database.
-- 
-- It tests and verifies:
--   1. Marketplace Worker Discovery View Filter Integrity (Pending/Rejected online workers excluded)
--   2. Privilege Escalation Prevention (Role & Worker Metric Tampering)
--   3. Row Level Security — Customer & Worker Data Privacy Boundaries
--   4. Privileged Administrative Procedure (provision_admin_user)
--   5. Anonymous Role Access Restrictions (Defense-in-Depth)
--
-- All changes are safely and completely discarded at the end via ROLLBACK.
-- ====================================================================

BEGIN;

DO $$
DECLARE
  v_admin_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  v_customer_a_id uuid := '00000000-0000-0000-0000-000000000002'::uuid;
  v_customer_b_id uuid := '00000000-0000-0000-0000-000000000003'::uuid;
  v_worker_verified_id uuid := '00000000-0000-0000-0000-000000000004'::uuid;
  v_worker_pending_id uuid := '00000000-0000-0000-0000-000000000005'::uuid;
  v_worker_rejected_id uuid := '00000000-0000-0000-0000-000000000006'::uuid;
  v_booking_id uuid := '00000000-0000-0000-0000-000000000010'::uuid;
  v_test_count integer;
  v_escalation_role text;
  v_tampered_metric numeric;
BEGIN
  RAISE NOTICE '>>> STARTING SAHARAA DATABASE AUTHORIZATION TEST SUITE <<<';

  -- --------------------------------------------------------------------
  -- 0. TEST HARNESS SETUP
  -- --------------------------------------------------------------------
  -- Set service_role and allow_role_change during setup so test fixtures can be established
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  PERFORM set_config('saharaa.allow_role_change', 'true', true);

  -- Ensure core service catalog row exists for foreign key references
  INSERT INTO public.services (id, name_en, name_hi, icon, description, base_price, is_active)
  VALUES 
    ('plumbing', 'Plumbing', 'प्लंबिंग', 'wrench', 'Leaks, taps, tanks & fittings', 199.00, true),
    ('electrical', 'Electrical', 'बिजली', 'zap', 'Switches, wiring & fans', 179.00, true),
    ('cleaning', 'Home Cleaning', 'सफ़ाई', 'sparkles', 'Deep & regular cleaning', 499.00, true)
  ON CONFLICT (id) DO NOTHING;

  -- Seed mock auth.users so foreign key constraint (profiles.id -> auth.users.id) is satisfied
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES 
    (v_admin_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_admin@saharaa.mock', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"System Admin"}', now(), now()),
    (v_customer_a_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_cust_a@saharaa.mock', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Customer Alice"}', now(), now()),
    (v_customer_b_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_cust_b@saharaa.mock', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Customer Bob"}', now(), now()),
    (v_worker_verified_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_worker_v@saharaa.mock', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Ramesh Verified","role":"worker"}', now(), now()),
    (v_worker_pending_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_worker_p@saharaa.mock', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Suresh Pending","role":"worker"}', now(), now()),
    (v_worker_rejected_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'test_worker_r@saharaa.mock', '', now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Mahesh Rejected","role":"worker"}', now(), now())
  ON CONFLICT (id) DO NOTHING;

  -- Seed public.profiles with valid schema columns (id, role, full_name, phone)
  INSERT INTO public.profiles (id, role, full_name, phone)
  VALUES 
    (v_admin_id, 'admin', 'System Admin', '+919999900001'),
    (v_customer_a_id, 'customer', 'Customer Alice', '+919999900002'),
    (v_customer_b_id, 'customer', 'Customer Bob', '+919999900003'),
    (v_worker_verified_id, 'worker', 'Ramesh Verified', '+919999900004'),
    (v_worker_pending_id, 'worker', 'Suresh Pending', '+919999900005'),
    (v_worker_rejected_id, 'worker', 'Mahesh Rejected', '+919999900006')
  ON CONFLICT (id) DO UPDATE SET
    role = EXCLUDED.role,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;

  -- Seed public.worker_profiles
  -- A. Verified worker
  INSERT INTO public.worker_profiles (id, primary_service_id, verification_status, is_online, is_available_now, trust_dna, rating)
  VALUES (v_worker_verified_id, 'plumbing', 'verified', true, true, 92, 4.85)
  ON CONFLICT (id) DO UPDATE SET
    primary_service_id = EXCLUDED.primary_service_id,
    verification_status = EXCLUDED.verification_status,
    is_online = EXCLUDED.is_online,
    is_available_now = EXCLUDED.is_available_now,
    trust_dna = EXCLUDED.trust_dna,
    rating = EXCLUDED.rating;

  -- B. Pending worker (with is_online = true)
  INSERT INTO public.worker_profiles (id, primary_service_id, verification_status, is_online, is_available_now, trust_dna, rating)
  VALUES (v_worker_pending_id, 'electrical', 'pending', true, true, NULL, NULL)
  ON CONFLICT (id) DO UPDATE SET
    primary_service_id = EXCLUDED.primary_service_id,
    verification_status = EXCLUDED.verification_status,
    is_online = EXCLUDED.is_online,
    is_available_now = EXCLUDED.is_available_now,
    trust_dna = EXCLUDED.trust_dna,
    rating = EXCLUDED.rating;

  -- C. Rejected worker (with is_online = true)
  INSERT INTO public.worker_profiles (id, primary_service_id, verification_status, is_online, is_available_now, trust_dna, rating)
  VALUES (v_worker_rejected_id, 'cleaning', 'rejected', true, true, 60, 3.20)
  ON CONFLICT (id) DO UPDATE SET
    primary_service_id = EXCLUDED.primary_service_id,
    verification_status = EXCLUDED.verification_status,
    is_online = EXCLUDED.is_online,
    is_available_now = EXCLUDED.is_available_now,
    trust_dna = EXCLUDED.trust_dna,
    rating = EXCLUDED.rating;

  -- Create an active booking between Customer Alice and Worker Ramesh using actual schema columns
  INSERT INTO public.bookings (
    id,
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
    total_amount,
    booking_status,
    payment_status
  )
  VALUES (
    v_booking_id,
    'BK-TEST-0001',
    v_customer_a_id,
    v_worker_verified_id,
    'plumbing',
    'Pipe leak repair',
    'Kitchen faucet pipe repair',
    'Flat 101, Saket, Delhi',
    'Laxmi Nagar, Delhi',
    'asap',
    now() + interval '1 hour',
    249.00,
    249.00,
    'in_progress',
    'pending'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Disable setup flag before starting authorization tests
  PERFORM set_config('saharaa.allow_role_change', 'false', true);

  -- --------------------------------------------------------------------
  -- TEST 1: MARKETPLACE DISCOVERY VIEW INTEGRITY
  -- --------------------------------------------------------------------
  RAISE NOTICE 'Test 1: Validating marketplace_workers view filtering...';

  -- A. Verified worker MUST appear
  SELECT COUNT(*) INTO v_test_count FROM public.marketplace_workers WHERE id = v_worker_verified_id;
  ASSERT v_test_count = 1, 'FAILED: Verified worker should appear in marketplace_workers view';

  -- B. Pending worker MUST NOT appear even if is_online = true
  SELECT COUNT(*) INTO v_test_count FROM public.marketplace_workers WHERE id = v_worker_pending_id;
  ASSERT v_test_count = 0, 'FAILED: Pending worker must NOT appear in marketplace_workers view, even with is_online = true';

  -- C. Rejected worker MUST NOT appear even if is_online = true
  SELECT COUNT(*) INTO v_test_count FROM public.marketplace_workers WHERE id = v_worker_rejected_id;
  ASSERT v_test_count = 0, 'FAILED: Rejected worker must NOT appear in marketplace_workers view, even with is_online = true';

  RAISE NOTICE 'PASSED: marketplace_workers filter correctly isolates verified workers only.';

  -- --------------------------------------------------------------------
  -- TEST 2: PRIVILEGE ESCALATION PREVENTION (ROLE ESCALATION)
  -- --------------------------------------------------------------------
  RAISE NOTICE 'Test 2: Validating role escalation triggers...';

  -- Simulate non-admin authenticated session
  PERFORM set_config('request.jwt.claim.sub', v_customer_a_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Customer attempts to promote themselves to admin via UPDATE
  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = v_customer_a_id;
  EXCEPTION WHEN OTHERS THEN
    -- Expected exception from prevent_role_escalation trigger
    NULL;
  END;

  SELECT role INTO v_escalation_role FROM public.profiles WHERE id = v_customer_a_id;
  ASSERT v_escalation_role = 'customer', 'FAILED: Non-admin customer was able to elevate role to admin via UPDATE!';

  RAISE NOTICE 'PASSED: Role escalation blocked by enforce_no_role_escalation trigger.';

  -- --------------------------------------------------------------------
  -- TEST 3: WORKER METRIC TAMPERING DEFENSE
  -- --------------------------------------------------------------------
  RAISE NOTICE 'Test 3: Validating worker metric tampering triggers...';

  -- Simulate worker session
  PERFORM set_config('request.jwt.claim.sub', v_worker_pending_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Worker attempts to self-verify and boost Trust DNA to 100
  BEGIN
    UPDATE public.worker_profiles 
    SET verification_status = 'verified', trust_dna = 100 
    WHERE id = v_worker_pending_id;
  EXCEPTION WHEN OTHERS THEN
    -- Expected exception from prevent_worker_metric_tampering trigger
    NULL;
  END;

  SELECT trust_dna INTO v_tampered_metric FROM public.worker_profiles WHERE id = v_worker_pending_id;
  ASSERT v_tampered_metric IS NULL, 'FAILED: Worker was able to modify protected trust_dna score!';

  SELECT COUNT(*) INTO v_test_count FROM public.worker_profiles 
  WHERE id = v_worker_pending_id AND verification_status = 'verified';
  ASSERT v_test_count = 0, 'FAILED: Worker was able to self-verify their status!';

  RAISE NOTICE 'PASSED: Worker metric tampering blocked by enforce_no_worker_metric_tampering trigger.';

  -- --------------------------------------------------------------------
  -- TEST 4: ROW LEVEL SECURITY — CROSS-CUSTOMER DATA PRIVACY
  -- --------------------------------------------------------------------
  RAISE NOTICE 'Test 4: Validating Row Level Security boundaries...';

  -- Switch to authenticated role so PostgreSQL enforces RLS
  PERFORM set_config('role', 'authenticated', true);
  PERFORM set_config('request.jwt.claim.sub', v_customer_b_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Customer Bob attempts to see Customer Alice's booking
  SELECT COUNT(*) INTO v_test_count FROM public.bookings WHERE id = v_booking_id;
  ASSERT v_test_count = 0, 'FAILED: Customer B should NOT be able to view Customer A booking!';

  -- Customer Bob attempts to see Customer Alice's private profile
  SELECT COUNT(*) INTO v_test_count FROM public.profiles WHERE id = v_customer_a_id;
  ASSERT v_test_count = 0, 'FAILED: Customer B should NOT be able to view Customer A private profile!';

  -- Now simulate Worker Ramesh who IS assigned to Customer Alice's booking
  PERFORM set_config('request.jwt.claim.sub', v_worker_verified_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  -- Worker Ramesh CAN see Customer Alice's booking
  SELECT COUNT(*) INTO v_test_count FROM public.bookings WHERE id = v_booking_id;
  ASSERT v_test_count = 1, 'FAILED: Assigned worker should be able to view active booking details!';

  -- Worker Ramesh CAN see Customer Alice's profile (for emergency & booking execution)
  SELECT COUNT(*) INTO v_test_count FROM public.profiles WHERE id = v_customer_a_id;
  ASSERT v_test_count = 1, 'FAILED: Active counterparties should be able to view counterparty profile!';

  RAISE NOTICE 'PASSED: Row Level Security cleanly isolates unauthorized parties while granting booking counterparties access.';

  -- --------------------------------------------------------------------
  -- TEST 5: PRIVILEGED PROCEDURE ADMIN PROVISIONING
  -- --------------------------------------------------------------------
  RAISE NOTICE 'Test 5: Validating privileged admin provisioning procedure...';

  -- A. An ordinary authenticated user CANNOT execute provision_admin_user
  PERFORM set_config('request.jwt.claim.sub', v_customer_a_id::text, true);
  PERFORM set_config('request.jwt.claim.role', 'authenticated', true);

  BEGIN
    PERFORM public.provision_admin_user(v_customer_a_id);
    RAISE EXCEPTION 'Security breach: Non-admin was able to invoke provision_admin_user!';
  EXCEPTION WHEN OTHERS THEN
    -- Expected rejection (unauthorized caller or permission denied)
    NULL;
  END;

  SELECT role INTO v_escalation_role FROM public.profiles WHERE id = v_customer_a_id;
  ASSERT v_escalation_role = 'customer', 'FAILED: Non-admin customer was promoted via unauthorized procedure call!';

  -- B. Return to postgres / service_role context and verify authorized provisioning succeeds
  PERFORM set_config('role', 'postgres', true);
  PERFORM set_config('request.jwt.claim.role', 'service_role', true);
  PERFORM public.provision_admin_user(v_customer_b_id);

  SELECT role INTO v_escalation_role FROM public.profiles WHERE id = v_customer_b_id;
  ASSERT v_escalation_role = 'admin', 'FAILED: Privileged procedure provision_admin_user failed to promote target user!';

  RAISE NOTICE 'PASSED: Privileged admin provisioning procedure functions as expected.';

  -- --------------------------------------------------------------------
  -- TEST 6: ANONYMOUS ROLE RESTRICTIONS (DEFENSE-IN-DEPTH)
  -- --------------------------------------------------------------------
  RAISE NOTICE 'Test 6: Validating anonymous role access restrictions...';

  PERFORM set_config('role', 'anon', true);
  PERFORM set_config('request.jwt.claim.role', 'anon', true);
  PERFORM set_config('request.jwt.claim.sub', '', true);

  -- A. Anonymous CAN read services catalog
  SELECT COUNT(*) INTO v_test_count FROM public.services;
  ASSERT v_test_count > 0, 'FAILED: Anonymous users should be able to view services catalog!';

  -- B. Anonymous CAN read marketplace_workers view
  SELECT COUNT(*) INTO v_test_count FROM public.marketplace_workers;
  ASSERT v_test_count >= 1, 'FAILED: Anonymous users should be able to view verified marketplace workers!';

  -- C. Anonymous CANNOT read private profiles table (RLS returns 0 rows or permission denied)
  BEGIN
    SELECT COUNT(*) INTO v_test_count FROM public.profiles;
    ASSERT v_test_count = 0, 'FAILED: Anonymous users must NOT see any rows from private profiles table!';
  EXCEPTION WHEN insufficient_privilege THEN
    -- Expected: Table-level privilege revocation successfully blocked direct query
    NULL;
  END;

  -- Reset role back to postgres for safe rollback
  PERFORM set_config('role', 'postgres', true);

  RAISE NOTICE 'PASSED: Anonymous role access strictly restricted to public projections.';
  RAISE NOTICE '>>> ALL DATABASE AUTHORIZATION TESTS COMPLETED SUCCESSFULLY! <<<';
END $$;

-- Roll back all test data so staging/dev database remains untouched
ROLLBACK;
