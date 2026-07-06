import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

// True only when both env vars are present. Callers can skip DB work otherwise.
export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseKey);

// Fall back to a harmless placeholder so client construction never throws
// (e.g. during a build where env vars aren't set). Real calls just no-op then.
export const createClient = () =>
  createBrowserClient(
    supabaseUrl ?? "https://placeholder.supabase.co",
    supabaseKey ?? "placeholder-anon-key"
  );
