import { redirect } from "@tanstack/react-router";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/**
 * Session is stored in localStorage — unavailable during SSR.
 * Skip auth in beforeLoad on the server; enforce on client navigations.
 */
function isServerRender() {
  return typeof window === "undefined";
}

/**
 * Use in route `beforeLoad`. Redirects to /login?redirect=... when no session.
 */
export async function requireSession(pathname: string): Promise<Session | null> {
  if (isServerRender()) return null;

  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/login", search: { redirect: pathname } as never });
  }
  return data.session;
}

/**
 * Anyone authenticated has a client identity.
 */
export async function requireClient(pathname: string) {
  return requireSession(pathname);
}

/**
 * Owner of a business — verifies via Supabase JS (sidesteps the GET /businesses/:id RLS bug).
 */
export async function requireOwner(businessId: string, pathname: string) {
  const session = await requireSession(pathname);
  if (!session) return null;

  const { data, error } = await supabase
    .from("businesses")
    .select("id, owner_id")
    .eq("id", businessId)
    .eq("owner_id", session.user.id)
    .maybeSingle();
  if (error || !data) {
    throw redirect({ to: "/wallet" });
  }
  return session;
}

/** Alias — backend admin auth = business owner. */
export const requireAdmin = requireOwner;
