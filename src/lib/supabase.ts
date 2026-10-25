import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Saharaa Reusable Supabase Client Module
 *
 * Requirements:
 * - Reads environment variables via Vite `import.meta.env`.
 * - Validates presence and formatting without logging secrets.
 * - Exposes a single shared client instance.
 * - Does not expose service role or administrative secret keys.
 */

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabasePublishableKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

export interface SupabaseConfigStatus {
  isConfigured: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  errorMessage: string | null;
}

export function getSupabaseConfigStatus(): SupabaseConfigStatus {
  const hasUrl = Boolean(
    supabaseUrl &&
    typeof supabaseUrl === "string" &&
    supabaseUrl.trim() !== "" &&
    !supabaseUrl.includes("your-project-id")
  );

  const hasKey = Boolean(
    supabasePublishableKey &&
    typeof supabasePublishableKey === "string" &&
    supabasePublishableKey.trim() !== "" &&
    !supabasePublishableKey.includes("your-supabase-publishable-key") &&
    !supabasePublishableKey.includes("your-supabase-anon-key")
  );

  let errorMessage: string | null = null;
  if (!hasUrl && !hasKey) {
    errorMessage = "Supabase configuration missing: VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are not set.";
  } else if (!hasUrl) {
    errorMessage = "Supabase configuration missing: VITE_SUPABASE_URL is not configured.";
  } else if (!hasKey) {
    errorMessage = "Supabase configuration missing: VITE_SUPABASE_PUBLISHABLE_KEY is not configured.";
  }

  return {
    isConfigured: hasUrl && hasKey,
    hasUrl,
    hasKey,
    errorMessage,
  };
}

export function isSupabaseConfigured(): boolean {
  return getSupabaseConfigStatus().isConfigured;
}

// Create single reusable client instance or safe fallback dummy if configuration is incomplete
const config = getSupabaseConfigStatus();

export const supabase: SupabaseClient = createClient(
  config.hasUrl ? (supabaseUrl as string) : "https://placeholder-url.supabase.co",
  config.hasKey ? (supabasePublishableKey as string) : "placeholder-anon-key",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);
