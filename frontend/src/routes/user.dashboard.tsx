import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Copy, Gift, Users, RefreshCw, ChevronLeft, Store } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { RadialCountdown } from "@/components/ui/radial-countdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

export const Route = createFileRoute("/user/dashboard")({
  component: UserDashboard,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: "Mi Dashboard · NexoLeal" }] }),
});

const CYCLE = 90;

function buildQrPayload(phone: string): string {
  const windowIndex = Math.floor(Date.now() / 1000 / CYCLE);
  return JSON.stringify({ p: phone, w: windowIndex });
}

const MOCK_DISCOUNTS = [
  {
    id: "1",
    title: "10% en tu próxima compra",
    business: "La Barbería Sur",
    expires: "31 may",
    active: true,
  },
  {
    id: "2",
    title: "Café gratis al acumular 5 visitas",
    business: "Café Contigo",
    expires: "15 jun",
    active: true,
  },
  {
    id: "3",
    title: "2x1 en bebidas los martes",
    business: "Café Contigo",
    expires: "Vence en 3 días",
    active: false,
  },
];

function UserDashboard() {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState<number>(CYCLE);
  const [qrPayload, setQrPayload] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");

  useEffect(() => {
    const raw = localStorage.getItem("nexoleal:consumer-session");
    if (!raw) {
      navigate({ to: "/user/register" });
      return;
    }
    const session = JSON.parse(raw) as { phone: string; referralCode: string | null };
    setPhone(session.phone);
    const suffix = parseInt(session.phone.slice(-4), 10);
    setReferralCode(`REF-${session.phone.slice(0, 3)}-${suffix}`);
    setQrPayload(buildQrPayload(session.phone));
  }, [navigate]);

  useEffect(() => {
    if (!phone) return;

    const tick = () => {
      const ts = Math.floor(Date.now() / 1000);
      const remaining = CYCLE - (ts % CYCLE);
      setSecondsLeft(remaining);
      if (remaining === CYCLE) {
        setQrPayload(buildQrPayload(phone));
      }
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phone]);

  const forceRefresh = () => {
    setQrPayload(buildQrPayload(phone));
    setSecondsLeft(CYCLE);
    toast("Código renovado");
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode).then(() => toast.success("Código copiado"));
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] px-4 pb-24 pt-8">
      <div className="mx-auto max-w-sm space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <p className="eyebrow text-[color:var(--color-signal)]">Hola,</p>
            <h1 className="display-md text-[color:var(--color-cream)]">•••• {phone.slice(-4)}</h1>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/" })}
            className="mt-1 flex items-center gap-1 text-xs text-[color:var(--color-cream)]/40 hover:text-[color:var(--color-cream)]/80 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            Inicio
          </button>
        </div>

        {/* QR dinámico */}
        <div className="surface-ink flex flex-col items-center py-8">
          <p className="text-xs uppercase tracking-widest text-[color:var(--color-cream)]/50">
            Muéstrale este QR al negocio
          </p>

          <RadialCountdown
            seconds={secondsLeft}
            total={CYCLE}
            size={240}
            stroke={5}
            className="mt-4"
          >
            <div className="flex flex-col items-center gap-2">
              {qrPayload ? (
                <QRCodeSVG
                  value={qrPayload}
                  size={160}
                  bgColor="transparent"
                  fgColor="#f5e8d8"
                  level="M"
                />
              ) : (
                <div className="h-[160px] w-[160px] animate-pulse rounded-lg bg-white/5" />
              )}
            </div>
          </RadialCountdown>

          <p className="mt-2 text-xs text-[color:var(--color-cream)]/30">
            Se renueva en {secondsLeft}s
          </p>

          <button
            type="button"
            onClick={forceRefresh}
            className="mt-2 flex items-center gap-1.5 text-xs text-[color:var(--color-cream)]/40 underline-offset-2 hover:text-[color:var(--color-cream)]/70"
          >
            <RefreshCw className="h-3 w-3" /> Renovar ahora
          </button>
        </div>

        <Separator className="bg-white/5" />

        {/* Invitar amigos */}
        <div className="surface-ink p-5">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[color:var(--color-signal)]" />
            <h2 className="text-sm font-semibold text-[color:var(--color-cream)]">
              Invitar amigos
            </h2>
          </div>
          <p className="mt-1 text-xs text-[color:var(--color-cream)]/50">
            Comparte tu código y gana recompensas cuando se registren.
          </p>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-[var(--color-bg-elevated)] px-4 py-3">
            <span className="font-mono text-sm font-semibold tracking-widest text-[color:var(--color-signal)]">
              {referralCode}
            </span>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={copyReferral}
              className="h-7 w-7 p-0 text-[color:var(--color-cream)]/60 hover:text-[color:var(--color-cream)]"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <Separator className="bg-white/5" />

        {/* Mis descuentos */}
        <div>
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-[color:var(--color-signal)]" />
            <h2 className="text-sm font-semibold text-[color:var(--color-cream)]">
              Mis descuentos
            </h2>
          </div>

          <ul className="mt-3 space-y-2">
            {MOCK_DISCOUNTS.map((d) => (
              <li
                key={d.id}
                className="rounded-xl border border-white/5 bg-[var(--color-bg-elevated)] px-4 py-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm text-[color:var(--color-cream)]">{d.title}</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <Store className="h-3 w-3 shrink-0 text-[color:var(--color-signal)]" />
                      <span className="truncate text-xs font-medium text-[color:var(--color-signal)]/80">
                        {d.business}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[color:var(--color-cream)]/40">
                      Vence: {d.expires}
                    </p>
                  </div>
                  <Badge
                    className={
                      d.active
                        ? "shrink-0 bg-[var(--color-health)]/15 text-[color:var(--color-health)]"
                        : "shrink-0 bg-[var(--color-status-warn)]/15 text-[color:var(--color-status-warn)]"
                    }
                  >
                    {d.active ? "Activo" : "Por vencer"}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
