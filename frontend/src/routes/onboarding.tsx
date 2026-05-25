import { RouteError } from "@/components/RouteError";
import { createFileRoute, Link, redirect, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import { BrandStep } from "@/components/onboarding/BrandStep";
import { RewardStep } from "@/components/onboarding/RewardStep";
import { StepIndicator, type OnboardingStep } from "@/components/onboarding/StepIndicator";
import { useLocale } from "@/contexts/LocaleContext";
import { businessesApi, type CreateStaffKeyResponse } from "@/lib/api/businesses";
import { ApiError } from "@/lib/api-client";
import { STAFF_KEY_STORAGE } from "@/lib/onboarding-brand";
import { setStaffKey } from "@/lib/staff-key-storage";

const searchSchema = z.object({
  businessId: z.string().uuid().optional(),
  business: z.string().trim().max(120).optional(),
  type: z.string().trim().max(60).optional(),
  step: z.enum(["brand", "reward", "finish"]).optional(),
});

export const Route = createFileRoute("/onboarding")({
  validateSearch: (search) => searchSchema.parse(search),
  beforeLoad: ({ search }) => {
    if (!search.businessId) {
      throw redirect({ to: "/signup" });
    }
    if (search.step === "finish") {
      throw redirect({
        to: "/dashboard/$businessId",
        params: { businessId: search.businessId },
      });
    }
  },
  component: OnboardingPage,
  errorComponent: RouteError,
  head: () => ({
    meta: [
      { title: "Configura tu negocio · NexoLeal" },
      {
        name: "description",
        content:
          "Configura tu programa de lealtad en 2 pasos: personaliza tu marca y crea tu primera recompensa.",
      },
    ],
  }),
});

function readCachedStaffKey(businessId: string): CreateStaffKeyResponse | null {
  try {
    const raw = sessionStorage.getItem(STAFF_KEY_STORAGE(businessId));
    if (!raw) return null;
    if (raw.startsWith("{")) {
      return JSON.parse(raw) as CreateStaffKeyResponse;
    }
    return {
      id: "cached",
      label: "Dispositivo principal",
      rawKey: raw,
      headerValue: raw,
      createdAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function ensureStaffKey(businessId: string) {
  const cached = readCachedStaffKey(businessId);
  if (cached?.headerValue) {
    await setStaffKey(cached.headerValue);
    return;
  }
  const created = await businessesApi.createStaffKey(businessId, {
    label: "Dispositivo principal",
  });
  try {
    sessionStorage.setItem(STAFF_KEY_STORAGE(businessId), JSON.stringify(created));
  } catch {
    // ignore
  }
  await setStaffKey(created.headerValue);
}

function OnboardingPage() {
  const { d } = useLocale();
  const { businessId, business, type, step: stepParam } = Route.useSearch();
  const navigate = useNavigate({ from: Route.fullPath });
  const step: OnboardingStep = stepParam === "reward" ? "reward" : "brand";

  const businessName = business ?? "Tu negocio";
  const businessCategory = type?.toLowerCase() ?? "negocio";

  const setStep = (next: OnboardingStep) => {
    navigate({
      search: (prev) => ({ ...prev, step: next }),
    });
  };

  const goToDashboard = () => {
    localStorage.setItem("nexoleal:current-business-id", businessId!);
    navigate({
      to: "/dashboard/$businessId",
      params: { businessId: businessId! },
    });
  };

  const [stampsRequired, setStampsRequired] = useState(10);
  const [rewardDescription, setRewardDescription] = useState("Servicio gratis");

  const updateConfig = useMutation({
    mutationFn: async () => {
      await businessesApi.updateLoyaltyConfig(businessId!, {
        stampsRequired,
        rewardDescription,
      });
      try {
        await ensureStaffKey(businessId!);
      } catch {
        // Staff key can be created later from settings or scan setup.
      }
    },
    onSuccess: () => {
      toast.success(d.onboarding.programActive);
      goToDashboard();
    },
    onError: (e) => {
      const message = e instanceof ApiError ? e.message : d.onboarding.rewardError;
      toast.error(message);
    },
  });

  if (!businessId) return null;

  return (
    <div className="min-h-screen bg-[var(--color-bg-paper)]">
      <header className="border-b border-[var(--border)] bg-[var(--surface)]">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-[color:var(--color-ink)]">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-[var(--color-signal)] text-[color:var(--color-ink)]">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="font-display text-lg font-semibold">NexoLeal</span>
          </Link>
          <span className="text-sm text-[color:var(--color-ink-soft)]">
            {d.onboarding.onboardingLabel}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
        <div className="mx-auto max-w-3xl text-center">
          <div className="eyebrow mb-3">{d.onboarding.welcomeEyebrow}</div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-[color:var(--color-ink)] sm:text-4xl">
            {business
              ? d.onboarding.welcomeTitleNamed.replace("{name}", business)
              : d.onboarding.welcomeTitle}
          </h1>
          <p className="mt-3 text-lg text-[color:var(--color-ink-soft)]">
            {type
              ? d.onboarding.welcomeBodyNamed.replace("{type}", type.toLowerCase())
              : d.onboarding.welcomeBody}
          </p>
        </div>

        <StepIndicator current={step} />

        <div className="mt-10">
          {step === "brand" && (
            <BrandStep
              businessId={businessId}
              businessName={businessName}
              businessCategory={businessCategory}
              rewardDescription={rewardDescription}
              stampsRequired={stampsRequired}
              onComplete={() => setStep("reward")}
            />
          )}

          {step === "reward" && (
            <RewardStep
              stampsRequired={stampsRequired}
              rewardDescription={rewardDescription}
              onStampsChange={setStampsRequired}
              onRewardChange={setRewardDescription}
              onBack={() => setStep("brand")}
              onSubmit={() => updateConfig.mutate()}
              isPending={updateConfig.isPending}
            />
          )}
        </div>
      </main>
    </div>
  );
}
