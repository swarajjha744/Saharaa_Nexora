import { supabase, getSupabaseConfigStatus } from "./supabase";

/**
 * Saharaa Safe Backend Connection Diagnostic
 *
 * Requirements:
 * - Never logs or exposes credentials.
 * - Distinguishes clearly between:
 *   1. Environment configuration valid
 *   2. Supabase endpoint reachable
 *   3. Database request successful (schema migrated vs pending)
 *   4. Authentication configured
 *   5. Application data integration completed (demo vs connected)
 */

export interface BackendHealthReport {
  timestamp: string;
  envConfigured: boolean;
  endpointReachable: boolean;
  databaseAccessible: boolean;
  authOperational: boolean;
  schemaMigrated: boolean;
  dataIntegrationComplete: boolean;
  details: {
    envMessage: string;
    networkMessage: string;
    databaseMessage: string;
    authMessage: string;
    integrationMessage: string;
  };
}

export async function checkSupabaseConnection(): Promise<BackendHealthReport> {
  const config = getSupabaseConfigStatus();
  const timestamp = new Date().toISOString();

  const report: BackendHealthReport = {
    timestamp,
    envConfigured: config.isConfigured,
    endpointReachable: false,
    databaseAccessible: false,
    authOperational: false,
    schemaMigrated: false,
    dataIntegrationComplete: false, // Phase 2A establishes foundation; full data layer is Phase 2B
    details: {
      envMessage: config.isConfigured
        ? "VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are validly configured."
        : (config.errorMessage || "Configuration missing or invalid."),
      networkMessage: "Pending check...",
      databaseMessage: "Pending check...",
      authMessage: "Pending check...",
      integrationMessage: "Phase 2A Foundation: Supabase client & migration schema established. Application screens currently operating in demo-safe mode until migrations are executed.",
    },
  };

  if (!config.isConfigured) {
    report.details.networkMessage = "Skipped (missing environment variables).";
    report.details.databaseMessage = "Skipped (missing environment variables).";
    report.details.authMessage = "Skipped (missing environment variables).";
    return report;
  }

  // 1. Check Auth operational & Endpoint reachable
  try {
    const { data: authData, error: authError } = await supabase.auth.getSession();
    if (authError) {
      report.authOperational = false;
      report.details.authMessage = `Auth service returned: ${authError.message}`;
      report.details.networkMessage = "Endpoint responded with auth error.";
    } else {
      report.endpointReachable = true;
      report.authOperational = true;
      report.details.networkMessage = "Supabase endpoint is reachable via HTTPS.";
      report.details.authMessage = authData.session
        ? `Authenticated session active (${authData.session.user.email || "user"}).`
        : "Auth service operational (currently in anonymous guest state).";
    }
  } catch (err: any) {
    report.endpointReachable = false;
    report.authOperational = false;
    report.details.networkMessage = `Network error: Unable to reach Supabase endpoint (${err?.message || "connection failed"}).`;
    report.details.authMessage = "Auth service unreachable.";
    report.details.databaseMessage = "Database unreachable.";
    return report;
  }

  // 2. Safe Database Request Check against public non-sensitive table (services)
  try {
    const { data, error } = await supabase
      .from("services")
      .select("id, name_en")
      .limit(1);

    if (error) {
      // Common code 42P01 means table does not exist yet (migrations pending)
      if (error.code === "42P01" || error.message?.includes("does not exist")) {
        report.databaseAccessible = true;
        report.schemaMigrated = false;
        report.details.databaseMessage = "Database connection reached successfully, but 'services' table is not yet created. Migrations need to be executed via Supabase SQL Editor.";
      } else {
        report.databaseAccessible = false;
        report.schemaMigrated = false;
        report.details.databaseMessage = `Database query returned: ${error.message} (code: ${error.code || "unknown"})`;
      }
    } else {
      report.databaseAccessible = true;
      report.schemaMigrated = true;
      let extra = "";
      try {
        const { error: viewError } = await supabase
          .from("marketplace_workers")
          .select("id")
          .limit(1);
        if (!viewError) {
          extra = " Public discovery view (marketplace_workers) verified.";
        }
      } catch {
        // Non-blocking view verification
      }
      report.details.databaseMessage = `Database query succeeded (${data?.length || 0} services verified).${extra}`;
    }
  } catch (err: any) {
    report.databaseAccessible = false;
    report.details.databaseMessage = `Database query error: ${err?.message || "request failed"}.`;
  }

  return report;
}
