import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Queries Supabase JS directly to find a business owned by the current user.
 * Sidesteps the broken `GET /businesses/:id` RLS issue documented in the gap analysis.
 */
export function useOwnedBusiness() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getUser().then(({ data }) => {
      if (!cancelled) setUserId(data.user?.id ?? null);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const query = useQuery({
    queryKey: ["user", userId, "owned-business"],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, is_active, plan, category")
        .eq("owner_id", userId!)
        .eq("is_active", true)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  return {
    businessId: query.data?.id ?? null,
    businessName: query.data?.name ?? null,
    business: query.data ?? null,
    isLoading: query.isLoading,
    refetch: query.refetch,
  };
}
