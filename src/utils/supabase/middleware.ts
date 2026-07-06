import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const updateSession = async (request: NextRequest) => {
  const supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  // If Supabase isn't configured (e.g. env vars missing on the deploy),
  // just pass the request through instead of crashing every route with a 500.
  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  try {
    let response = supabaseResponse;
    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh the auth session (no-op until Supabase Auth is enabled).
    await supabase.auth.getUser();
    return response;
  } catch {
    // Any Supabase/network failure must never break page rendering.
    return supabaseResponse;
  }
};
