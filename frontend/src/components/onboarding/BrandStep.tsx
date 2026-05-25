import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ColorPicker } from "@/components/onboarding/ColorPicker";
import { OnboardingCardPreview } from "@/components/onboarding/OnboardingCardPreview";
import { useLocale } from "@/contexts/LocaleContext";
import {
  loadBrandSettings,
  persistBrandSettings,
  type BrandSettings,
} from "@/lib/onboarding-brand";
import { ApiError } from "@/lib/api-client";
import { tokens } from "@/lib/theme";

interface BrandStepProps {
  businessId: string;
  businessName: string;
  businessCategory: string;
  rewardDescription: string;
  stampsRequired: number;
  onComplete: () => void;
}

export function BrandStep({
  businessId,
  businessName,
  businessCategory,
  rewardDescription,
  stampsRequired,
  onComplete,
}: BrandStepProps) {
  const { d } = useLocale();
  const [brand, setBrand] = useState<BrandSettings>({
    logoUrl: null,
    primaryColor: tokens.color.signal,
    tagline: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void loadBrandSettings(businessId).then((settings) => {
      if (!cancelled) setBrand(settings);
    });
    return () => {
      cancelled = true;
    };
  }, [businessId]);

  const update = (patch: Partial<BrandSettings>) => {
    setBrand((prev) => ({ ...prev, ...patch }));
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      const result = await persistBrandSettings(businessId, brand);
      if (!result.savedRemote) {
        toast.message(d.onboarding.brandSavedLocal, {
          description: d.onboarding.brandSavedLocalHint,
        });
      } else {
        toast.success(d.onboarding.brandSaved);
      }
      onComplete();
    } catch (e) {
      const message = e instanceof ApiError ? e.message : d.onboarding.brandError;
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const primaryColor = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(brand.primaryColor)
    ? brand.primaryColor
    : tokens.color.signal;

  return (
    <div className="surface-paper overflow-hidden">
      <div className="grid gap-8 p-6 lg:grid-cols-2 lg:p-8">
        <div>
          <h2 className="font-display text-xl font-semibold">{d.onboarding.brandTitle}</h2>
          <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
            {d.onboarding.brandDescription}
          </p>

          <div className="mt-6 space-y-6">
            <ColorPicker
              value={brand.primaryColor}
              onChange={(primaryColor) => update({ primaryColor })}
            />

            <div className="space-y-2">
              <Label htmlFor="tagline">{d.onboarding.taglineLabel}</Label>
              <Input
                id="tagline"
                value={brand.tagline}
                onChange={(e) => update({ tagline: e.target.value.slice(0, 60) })}
                placeholder={d.onboarding.taglinePlaceholder}
                maxLength={60}
              />
              <p className="text-xs text-[color:var(--color-ink-soft)]">
                {d.onboarding.taglineChars.replace("{n}", String(brand.tagline.length))}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
            <Button variant="ghost" asChild>
              <Link to="/">{d.onboarding.exitToHome}</Link>
            </Button>
            <Button size="lg" onClick={handleContinue} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> {d.onboarding.saving}
                </>
              ) : (
                <>
                  {d.onboarding.continue} <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center lg:border-l lg:border-[var(--border)] lg:pl-8">
          <OnboardingCardPreview
            businessName={businessName}
            businessCategory={businessCategory}
            rewardDescription={rewardDescription}
            stampsRequired={stampsRequired}
            logoUrl={null}
            primaryColor={primaryColor}
            tagline={brand.tagline}
          />
        </div>
      </div>
    </div>
  );
}
