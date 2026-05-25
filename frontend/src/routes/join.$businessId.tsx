import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clientsApi } from "@/lib/api/clients";
import { businessesApi } from "@/lib/api/businesses";
import { ApiError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/AppShell";
import { CelebrateConfetti } from "@/components/ui/celebrate-confetti";
import { IsoScene, NotFoundGlyph } from "@/components/ui/iso-scene";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSession } from "@/hooks/use-session";
import { useLocale } from "@/contexts/LocaleContext";
import type { Dictionary } from "@/lib/i18n";

export const Route = createFileRoute("/join/$businessId")({
  beforeLoad: ({ params }) => {
    if (params.businessId === "demo") {
      throw redirect({ to: "/signup" });
    }
  },
  component: JoinPage,
  errorComponent: RouteError,
  head: ({ params }) => ({
    meta: [
      { title: `Únete · NexoLeal` },
      { property: "og:title", content: `Únete al programa de lealtad` },
      { property: "og:description", content: "Acumula sellos y gana recompensas." },
    ],
  }),
});

function JoinPage() {
  const { d } = useLocale();
  const { businessId } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useSession();
  const [showAuth, setShowAuth] = useState(false);
  const [celebrating, setCelebrating] = useState(false);

  const config = useQuery({
    queryKey: ["business", businessId, "public-config"],
    retry: false,
    queryFn: async () => {
      try {
        const res = await businessesApi.getLoyaltyConfig(businessId);
        let businessName = d.join.defaultBusinessName;
        let category: "barbershop" | "salon" | "vet" | "cafe" | "gym" | "other" = "other";
        try {
          const biz = await businessesApi.get(businessId);
          businessName = biz.business.name;
          category = (biz.business.category as never) ?? "other";
        } catch {
          // best-effort business name from public profile
        }
        return {
          businessId,
          businessName,
          category,
          stampsRequired: res.loyaltyConfig.stamps_required ?? 8,
          rewardDescription: res.loyaltyConfig.reward_description ?? d.join.defaultReward,
        };
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) throw err;
        return {
          businessId,
          businessName: d.join.defaultBusinessName,
          category: "other" as const,
          stampsRequired: 8,
          rewardDescription: d.join.defaultReward,
        };
      }
    },
  });

  const data = config.data;

  const existingCard = useQuery({
    queryKey: ["client", "me", "loyalty", businessId],
    enabled: !!user,
    retry: false,
    queryFn: () => clientsApi.getLoyalty(businessId),
  });

  const join = useMutation({
    mutationFn: () =>
      clientsApi.register({
        businessId,
        fullName:
          user?.user_metadata?.full_name ?? user?.email?.split("@")[0] ?? d.join.defaultClientName,
      }),
    onSuccess: () => {
      setCelebrating(true);
      setTimeout(() => navigate({ to: "/wallet/$businessId", params: { businessId } }), 900);
    },
    onError: (err) => {
      toast.error(d.join.joinError, { description: (err as Error).message });
    },
  });

  if (config.isLoading) {
    return (
      <AppShell variant="dark">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-signal)]" />
        </div>
      </AppShell>
    );
  }

  if (config.isError || !data) {
    return (
      <AppShell variant="light">
        <div className="mx-auto max-w-md px-4 py-16">
          <IsoScene
            title={d.join.notFound}
            description={d.join.notFoundDescription}
            action={
              <Link to="/" className="btn-signal text-sm">
                {d.join.notFoundBack}
              </Link>
            }
          >
            <NotFoundGlyph />
          </IsoScene>
        </div>
      </AppShell>
    );
  }

  const alreadyMember = !!existingCard.data?.loyalty;

  return (
    <AppShell variant="dark">
      <CelebrateConfetti active={celebrating} />
      <div className="mx-auto max-w-md px-4 py-8">
        <span className="eyebrow inline-block text-[color:var(--color-cream)]/60">
          {d.join.programLabel}
        </span>

        <article className="surface-card relative mt-4 overflow-hidden p-6 text-[color:var(--color-ink)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-ink)] text-[color:var(--color-signal)]">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="font-display text-2xl leading-tight">{data.businessName}</p>
              <p className="text-xs text-[color:var(--color-ink-soft)]">
                {categoryLabel(data.category, d)}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-4 gap-2">
            {Array.from({ length: data.stampsRequired }).map((_, i) => (
              <div key={i} className="stamp-cell" aria-hidden />
            ))}
          </div>

          <div className="mt-6 border-t border-[color:var(--color-border)] pt-4">
            <p className="text-xs text-[color:var(--color-ink-soft)]">{d.join.yourReward}</p>
            <p className="font-display text-lg">{data.rewardDescription}</p>
          </div>
        </article>

        <h1 className="display-md mt-8 text-[color:var(--color-cream)]">
          {d.join.joinTitle.replace("{name}", data.businessName)}
        </h1>
        <p className="mt-2 text-sm text-[color:var(--color-cream)]/70">
          {d.join.accumulateStamps.replace("{n}", String(data.stampsRequired))}{" "}
          <strong>{data.rewardDescription}</strong>.
        </p>

        <div className="mt-8">
          {alreadyMember ? (
            <Link
              to="/wallet/$businessId"
              params={{ businessId }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[var(--color-status-good)] px-6 py-3 text-sm font-semibold text-white"
            >
              <CheckCircle2 className="h-4 w-4" /> {d.join.alreadyMember}
            </Link>
          ) : user ? (
            <Button
              disabled={join.isPending}
              onClick={() => join.mutate()}
              className="btn-celebrate w-full"
            >
              {join.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : d.join.joinNow}
            </Button>
          ) : (
            <Button onClick={() => setShowAuth(true)} className="btn-celebrate w-full">
              {d.join.joinNow}
            </Button>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-[color:var(--color-cream)]/50">
          {d.join.ownerQuestion}{" "}
          <Link to="/login" className="underline">
            {d.join.login}
          </Link>
        </p>
      </div>

      <JoinAuthDialog
        open={showAuth}
        onClose={() => setShowAuth(false)}
        businessId={businessId}
        onAuthed={() => {
          setShowAuth(false);
          join.mutate();
        }}
      />
    </AppShell>
  );
}

function categoryLabel(c: string, d: Dictionary): string {
  const map = d.join.categories as Record<string, string>;
  return map[c] ?? map.other;
}

function JoinAuthDialog({
  open,
  onClose,
  businessId,
  onAuthed,
}: {
  open: boolean;
  onClose: () => void;
  businessId: string;
  onAuthed: () => void;
}) {
  const { d } = useLocale();
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [form, setForm] = useState({ fullName: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            data: { full_name: form.fullName },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (error) throw error;
        if (!data.session) {
          localStorage.setItem("nexoleal:pending-join", businessId);
          toast.success(d.join.checkEmail);
          onClose();
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email,
          password: form.password,
        });
        if (error) throw error;
      }
      onAuthed();
    } catch (err) {
      toast.error(d.routeError.title, { description: (err as Error).message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-[var(--color-bg-paper)] text-[color:var(--color-ink)] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">
            {mode === "signup" ? d.join.createAccount : d.join.login}
          </DialogTitle>
          <DialogDescription>{d.join.walletFollows}</DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 rounded-full bg-[var(--color-cream)] p-1 text-xs">
          {(["signup", "login"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full px-3 py-1.5 font-medium ${mode === m ? "bg-[var(--color-ink)] text-[var(--color-cream)]" : ""}`}
            >
              {m === "signup" ? d.join.createAccountBtn : d.join.haveAccount}
            </button>
          ))}
        </div>
        <form onSubmit={submit} className="space-y-3">
          {mode === "signup" && (
            <div>
              <Label htmlFor="name">{d.join.nameLabel}</Label>
              <Input
                id="name"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                placeholder={d.wallet.yourName}
              />
            </div>
          )}
          <div>
            <Label htmlFor="join-email">{d.wallet.email}</Label>
            <Input
              id="join-email"
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div>
            <Label htmlFor="join-pwd">{d.login.passwordLabel}</Label>
            <Input
              id="join-pwd"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <Button type="submit" disabled={submitting} className="btn-celebrate w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : d.wallet.continue}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
