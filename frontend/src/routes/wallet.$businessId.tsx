import { RouteError } from "@/components/RouteError";
import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, RefreshCw, Loader2, QrCode, X, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { clientsApi } from "@/lib/api/clients";
import { tokensApi } from "@/lib/api/tokens";
import { visitsApi } from "@/lib/api/visits";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-client";
import { AppShell } from "@/components/layout/AppShell";
import { RadialCountdown } from "@/components/ui/radial-countdown";
import { CelebrateConfetti } from "@/components/ui/celebrate-confetti";
import { useLocale } from "@/contexts/LocaleContext";
import type { Dictionary, Locale } from "@/lib/i18n";

export const Route = createFileRoute("/wallet/$businessId")({
  beforeLoad: async ({ params }) => {
    if (params.businessId === "demo") {
      throw redirect({ to: "/signup" });
    }
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session)
      throw redirect({ to: "/login", search: { redirect: `/wallet/${params.businessId}` } });
  },
  component: WalletDetail,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Mi tarjeta · NexoLeal" }] }),
});

function WalletDetail() {
  const { d, locale } = useLocale();
  const { businessId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const loyalty = useQuery({
    queryKey: ["client", "me", "loyalty", businessId],
    queryFn: () => clientsApi.getLoyalty(businessId),
  });

  const history = useQuery({
    queryKey: ["client", "me", "visits", businessId],
    retry: false,
    queryFn: () => visitsApi.listMine({ businessId, limit: 20 }),
  });

  const generate = useMutation({
    mutationFn: () => tokensApi.generate({ businessId }),
    onSuccess: (data) => {
      setToken(data.token);
      setExpiresAt(new Date(data.expiresAt));
      setSecondsLeft(data.ttlSeconds);
    },
    onError: (e: ApiError) => {
      if (e.code === "AUTH_INVALID" || e.code === "AUTH_MISSING") {
        navigate({ to: "/login" });
        return;
      }
      toast.error(e.message);
    },
  });

  useEffect(() => {
    if (!expiresAt) return;
    const id = setInterval(() => {
      const remain = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 1000));
      setSecondsLeft(remain);
      if (remain === 0) {
        if (qrSheetOpen) {
          generate.mutate();
        } else {
          setToken(null);
          setExpiresAt(null);
        }
      }
    }, 500);
    return () => clearInterval(id);
  }, [expiresAt, qrSheetOpen, generate]);

  useEffect(() => {
    if (qrSheetOpen && !token) {
      generate.mutate();
    }
    if (!qrSheetOpen) {
      setToken(null);
      setExpiresAt(null);
    }
  }, [qrSheetOpen, token, generate]);

  const userIdRef = useRef<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userIdRef.current = data.user?.id ?? null;
    });
    const channel = supabase
      .channel(`visits:${businessId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visits",
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const clientUser = (payload.new as { client_user_id?: string }).client_user_id;
          if (clientUser && userIdRef.current && clientUser !== userIdRef.current) return;
          qc.invalidateQueries({ queryKey: ["client", "me", "loyalty", businessId] });
          qc.invalidateQueries({ queryKey: ["client", "me", "visits", businessId] });
          setQrSheetOpen(false);
          const rewardUnlocked = (payload.new as { reward_unlocked?: boolean }).reward_unlocked;
          if (rewardUnlocked) {
            setShowCelebration(true);
            setTimeout(() => setShowCelebration(false), 3500);
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [businessId, qc]);

  if (loyalty.isLoading) {
    return (
      <AppShell variant="dark">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[color:var(--color-signal)]" />
        </div>
      </AppShell>
    );
  }

  if (!loyalty.data) return null;
  const { business, loyalty: l } = loyalty.data;

  return (
    <AppShell variant="dark" showNav={false}>
      <CelebrateConfetti active={showCelebration} />
      <header className="sticky top-0 z-30 border-b border-white/5 bg-[rgba(13,13,13,0.85)] backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <Link
            to="/wallet"
            className="inline-flex items-center gap-1 text-sm text-[color:var(--color-cream)]/70"
          >
            <ArrowLeft className="h-4 w-4" /> {d.wallet.back}
          </Link>
          <button
            type="button"
            onClick={() =>
              qc.invalidateQueries({ queryKey: ["client", "me", "loyalty", businessId] })
            }
            aria-label={d.wallet.refresh}
            className="text-[color:var(--color-cream)]/60 hover:text-[color:var(--color-cream)]"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 pb-24">
        <article className="surface-card overflow-hidden p-6 text-[color:var(--color-ink)]">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[color:var(--color-ink-soft)] capitalize">
                {business.category}
              </p>
              <h2 className="font-display text-2xl leading-tight">{business.name}</h2>
            </div>
            {l.status === "active" && (
              <span className="inline-flex items-center rounded-full bg-[var(--color-health)] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--color-ink)]">
                {d.wallet.active}
              </span>
            )}
          </div>

          <div className="mt-6 grid grid-cols-8 gap-1.5">
            {Array.from({ length: l.stampsRequired }).map((_, i) => (
              <div key={i} className={`stamp-cell ${i < l.stampCount ? "filled" : ""}`}>
                {i < l.stampCount && <Sparkles className="h-3 w-3" />}
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-[color:var(--color-border)] pt-4">
            <div className="flex items-baseline justify-between">
              <p className="text-xs text-[color:var(--color-ink-soft)]">
                {d.wallet.stampsRemaining.replace("{n}", String(l.stampsRemaining))}
              </p>
              <p className="font-display text-base">{l.rewardDescription}</p>
            </div>
          </div>
        </article>

        <Button
          onClick={() => setQrSheetOpen(true)}
          className="btn-signal mt-6 inline-flex w-full items-center justify-center gap-2 text-base"
        >
          <QrCode className="h-5 w-5" /> {d.wallet.showQr}
        </Button>

        <section className="mt-12">
          <p className="eyebrow text-[color:var(--color-cream)]/60">{d.wallet.history}</p>
          <h3 className="display-md mt-1 text-[color:var(--color-cream)]">{d.wallet.lastVisits}</h3>

          {history.isLoading ? (
            <div className="mt-6 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-[color:var(--color-signal)]" />
            </div>
          ) : history.data?.visits?.length ? (
            <ul className="mt-6 space-y-2">
              {history.data.visits.map((v) => (
                <li
                  key={v.id}
                  className="flex items-center justify-between rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] px-4 py-3"
                >
                  <div>
                    <p className="text-sm text-[color:var(--color-cream)]">
                      {formatRelative(v.created_at, d, locale)}
                    </p>
                    <p className="text-xs text-[color:var(--color-cream)]/50">
                      {new Date(v.created_at).toLocaleDateString(
                        locale === "es" ? "es-MX" : "en-US",
                        {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        },
                      )}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-signal)] px-2 py-0.5 text-[10px] font-semibold text-[color:var(--color-ink)]">
                    <Sparkles className="h-3 w-3" /> {d.wallet.stampBadge}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 text-sm text-[color:var(--color-cream)]/60">{d.wallet.noVisits}</p>
          )}
        </section>

        <p className="mt-10 text-center text-xs text-[color:var(--color-cream)]/40">
          {d.wallet.statsSummary
            .replace("{visits}", String(l.totalVisits))
            .replace("{rewards}", String(l.totalRewards))}
        </p>
      </main>

      <QRBottomSheet
        open={qrSheetOpen}
        onClose={() => setQrSheetOpen(false)}
        token={token}
        secondsLeft={secondsLeft}
        loading={generate.isPending}
      />
    </AppShell>
  );
}

function formatRelative(iso: string, d: Dictionary, locale: Locale): string {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diff = (now - then) / 1000;
  if (diff < 60) return d.wallet.momentAgo;
  if (diff < 3600) return d.wallet.minutesAgo.replace("{n}", String(Math.floor(diff / 60)));
  if (diff < 86400) return d.wallet.hoursAgo.replace("{n}", String(Math.floor(diff / 3600)));
  if (diff < 86400 * 7) return d.wallet.daysAgo.replace("{n}", String(Math.floor(diff / 86400)));
  return new Date(iso).toLocaleDateString(locale === "es" ? "es-MX" : "en-US", {
    day: "numeric",
    month: "short",
  });
}

function QRBottomSheet({
  open,
  onClose,
  token,
  secondsLeft,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  token: string | null;
  secondsLeft: number;
  loading: boolean;
}) {
  const { d } = useLocale();

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-3xl bg-[var(--color-bg-base)] p-6 text-[color:var(--color-cream)] shadow-[var(--shadow-lifted)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15" />
        <div className="flex items-center justify-between">
          <p className="font-display text-lg">{d.wallet.visitQr}</p>
          <button
            onClick={onClose}
            aria-label={d.wallet.closeLabel}
            className="rounded-full p-1 hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-8 flex flex-col items-center">
          {loading || !token ? (
            <div className="flex h-[320px] w-[320px] items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-[color:var(--color-signal)]" />
            </div>
          ) : (
            <RadialCountdown seconds={secondsLeft} total={90} size={320} stroke={6}>
              <div className="rounded-2xl bg-[var(--color-cream)] p-5">
                <QRCodeSVG value={token} size={220} level="M" fgColor="#0A0F1E" bgColor="#F5E8D8" />
              </div>
            </RadialCountdown>
          )}

          <p className="mt-6 text-center text-sm text-[color:var(--color-cream)]/80">
            {d.wallet.presentCodeCountdown.replace("{n}", String(secondsLeft))}
          </p>
        </div>
      </div>
    </div>
  );
}
