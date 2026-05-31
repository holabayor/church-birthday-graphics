import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!;

/** SSR-aware client - respects RLS, reads auth from cookies. Use for most routes. */
export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component - safe to ignore when middleware handles session refresh.
        }
      },
    },
  });
};

/**
 * Service-role admin client - bypasses RLS entirely.
 * Use ONLY in trusted server-side contexts (API routes, cron jobs).
 * Never expose this client to the browser.
 */
export const createAdminClient = () => {
  if (!supabaseSecretKey) {
    throw new Error(
      "SUPABASE_SECRET_KEY is not set. Add it to your .env.local file.\n" +
      "Find it in: Supabase Dashboard -> Project Settings -> API -> Secret key"
    );
  }
  return createSupabaseClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
  });
};
