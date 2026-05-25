import type { BusinessCategory } from "@/integrations/supabase/types";
import { mapBusinessTypeLabel } from "@/lib/business-categories";
import { supabase } from "@/integrations/supabase/client";

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
