import { RouteError } from "@/components/RouteError";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { requireAdmin } from "@/lib/auth-guards";
import { businessesApi } from "@/lib/api/businesses";
import { useOwnedBusiness } from "@/hooks/use-owned-business";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { SettingsTabBar, type SettingsTab } from "@/components/settings/SettingsTabBar";
import { SettingsHelpRail } from "@/components/settings/SettingsHelpRail";
import { GeneralSettingsTab } from "@/components/settings/GeneralSettingsTab";
import { LoyaltySettingsTab } from "@/components/settings/LoyaltySettingsTab";
import { StaffSettingsTab } from "@/components/settings/StaffSettingsTab";
import { AccountSettingsTab } from "@/components/settings/AccountSettingsTab";
import type { BusinessCategory } from "@/integrations/supabase/types";

const searchSchema = z.object({
  tab: z.enum(["general", "loyalty", "staff", "account"]).default("general"),
});

export const Route = createFileRoute("/settings/$businessId")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: async ({ params, location }) => {
    await requireAdmin(params.businessId, location.pathname);
  },
  component: SettingsPage,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Configuración · NexoLeal" }] }),
});

function SettingsPage() {
  const { businessId } = Route.useParams();
  const { tab } = Route.useSearch();
  const { businessName: ownedName } = useOwnedBusiness();

  const businessFromApi = useQuery({
    queryKey: ["business", businessId],
    queryFn: () => businessesApi.get(businessId),
    retry: false,
  });

  const businessFromSupabase = useQuery({
    queryKey: ["business", businessId, "supabase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, category, is_active, tagline, logo_url, primary_color, address, phone")
        .eq("id", businessId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const name =
    businessFromApi.data?.business.name ??
    businessFromSupabase.data?.name ??
    ownedName ??
    "Tu negocio";

  const category = (businessFromApi.data?.business.category ??
    businessFromSupabase.data?.category ??
    "other") as BusinessCategory;

  const isLoading = businessFromApi.isLoading && businessFromSupabase.isLoading;

  return (
    <AppShell variant="light">
      <header className="border-b border-[color:var(--border)] bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link
            to="/dashboard/$businessId"
            params={{ businessId }}
            className="inline-flex items-center gap-1 text-sm text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]"
          >
            <ArrowLeft className="h-4 w-4" /> Panel
          </Link>
          <span className="font-display text-sm font-semibold">Configuración</span>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:py-10">
        <div className="mb-6">
          <p className="eyebrow">Ajustes del negocio</p>
          <h1 className="display-md mt-2 font-display">Configuración de {name}</h1>
        </div>

        <SettingsTabBar businessId={businessId} activeTab={tab as SettingsTab} />

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px]">
          <div>
            {isLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-ink-soft)]" />
              </div>
            ) : (
              <>
                {tab === "general" && (
                  <GeneralSettingsTab
                    businessId={businessId}
                    initialName={name}
                    initialCategory={category}
                    initialTagline={
                      businessFromApi.data?.business.tagline ??
                      businessFromSupabase.data?.tagline ??
                      undefined
                    }
                    initialLogoUrl={
                      businessFromApi.data?.business.logo_url ??
                      businessFromSupabase.data?.logo_url ??
                      undefined
                    }
                    initialPrimaryColor={
                      businessFromApi.data?.business.primary_color ??
                      businessFromSupabase.data?.primary_color ??
                      undefined
                    }
                    initialAddress={
                      businessFromApi.data?.business.address ??
                      businessFromSupabase.data?.address ??
                      undefined
                    }
                    initialPhone={
                      businessFromApi.data?.business.phone ??
                      businessFromSupabase.data?.phone ??
                      undefined
                    }
                  />
                )}
                {tab === "loyalty" && (
                  <LoyaltySettingsTab businessId={businessId} businessName={name} />
                )}
                {tab === "staff" && <StaffSettingsTab businessId={businessId} />}
                {tab === "account" && <AccountSettingsTab />}
              </>
            )}
          </div>
          <SettingsHelpRail tab={tab as SettingsTab} />
        </div>
      </div>
    </AppShell>
  );
}
