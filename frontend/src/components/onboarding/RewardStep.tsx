import { ArrowRight, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useLocale } from "@/contexts/LocaleContext";

interface RewardStepProps {
  stampsRequired: number;
  rewardDescription: string;
  onStampsChange: (value: number) => void;
  onRewardChange: (value: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  isPending: boolean;
}

export function RewardStep({
  stampsRequired,
  rewardDescription,
  onStampsChange,
  onRewardChange,
  onBack,
  onSubmit,
  isPending,
}: RewardStepProps) {
  const { d } = useLocale();

  return (
    <form
      className="surface-paper p-6 lg:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        if (isPending) return;
        onSubmit();
      }}
    >
      <h2 className="font-display text-xl font-semibold">{d.onboarding.rewardTitle}</h2>
      <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">
        {d.onboarding.rewardDescription}
      </p>

      <div className="mt-6 space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="stamps">{d.onboarding.visitsRequired}</Label>
            <span className="text-sm font-semibold tabular-nums">{stampsRequired}</span>
          </div>
          <Slider
            id="stamps"
            min={1}
            max={30}
            step={1}
            value={[stampsRequired]}
            onValueChange={(v) => onStampsChange(v[0] ?? 10)}
          />
          <p className="text-xs text-[color:var(--color-ink-soft)]">
            {d.onboarding.visitsRecommend}
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reward">{d.onboarding.rewardLabel}</Label>
          <Input
            id="reward"
            value={rewardDescription}
            onChange={(e) => onRewardChange(e.target.value)}
            placeholder={d.onboarding.rewardPlaceholder}
            maxLength={120}
            required
          />
          <p className="text-xs text-[color:var(--color-ink-soft)]">{d.onboarding.rewardMax}</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack} disabled={isPending}>
          {d.onboarding.back}
        </Button>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> {d.onboarding.saving}
            </>
          ) : (
            <>
              {d.onboarding.saveAndContinue} <ArrowRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
