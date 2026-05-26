import type { BusinessCategory } from "@/integrations/supabase/types";
import { mapBusinessTypeLabel } from "@/lib/business-categories";
import { supabase } from "@/integrations/supabase/client";

export type AuthIntent = "business" | "client";

const AUTH_INTENT_KEY = "nexoleal:auth-intent";
const AUTH_SOURCE_KEY = "nexoleal:auth-source";

export type AuthSource = "login" | "signup";

export function setAuthSource(source: AuthSource) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_SOURCE_KEY, source);
  }
}

export function readAuthSource(): AuthSource | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(AUTH_SOURCE_KEY);
  return value === "login" || value === "signup" ? value : null;
}

export function clearAuthSource() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_SOURCE_KEY);
  }
}

export function setAuthIntent(intent: AuthIntent) {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_INTENT_KEY, intent);
  }
}

export function readAuthIntent(): AuthIntent | null {
  if (typeof window === "undefined") return null;
  const value = localStorage.getItem(AUTH_INTENT_KEY);
  return value === "business" || value === "client" ? value : null;
}

export function clearAuthIntent() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_INTENT_KEY);
  }
}

export async function signInWithGoogle(intent: AuthIntent, source?: AuthSource) {
  setAuthIntent(intent);
  if (source) setAuthSource(source);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  if (error) throw error;
}

export function onboardingSearch(params: {
  businessId: string;
  businessName: string;
  category: BusinessCategory | string;
}) {
  const label =
    typeof params.category === "string"
      ? mapBusinessTypeLabel(params.category as BusinessCategory)
      : mapBusinessTypeLabel(params.category);
  return {
    businessId: params.businessId,
    business: params.businessName,
    type: label,
  };
}

export async function signOut() {
  await supabase.auth.signOut();
  localStorage.removeItem("nexoleal:current-business-id");
  localStorage.removeItem("nexoleal:staff-key");
}
