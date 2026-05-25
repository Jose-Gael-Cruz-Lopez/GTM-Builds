import { RouteError } from "@/components/RouteError";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Copy, Gift, Store, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { RadialCountdown } from "@/components/ui/radial-countdown";
import { ConsumerFlowShell } from "@/components/consumer/ConsumerFlowShell";
import { useLocale } from "@/contexts/LocaleContext";

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

function UserDashboard() {
  const navigate = useNavigate();
  const { d } = useLocale();
  const [secondsLeft, setSecondsLeft] = useState<number>(CYCLE);
  const [qrPayload, setQrPayload] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [referralCode, setReferralCode] = useState<string>("");

  const discounts = useMemo(
    () => [
      {
        id: "1",
        title: d.userDashboard.discount1,
        business: d.userDashboard.discountBusiness1,
        expires: d.userDashboard.expires1,
        active: true,
      },
      {
        id: "2",
        title: d.userDashboard.discount2,
        business: d.userDashboard.discountBusiness2,
        expires: d.userDashboard.expires2,
        active: true,
      },
      {
        id: "3",
        title: d.userDashboard.discount3,
        business: d.userDashboard.discountBusiness2,
        expires: d.userDashboard.expires3,
        active: false,
      },
    ],
    [d],
  );

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
    toast(d.userDashboard.codeRenewed);
  };

  const copyReferral = () => {
    navigator.clipboard
      .writeText(referralCode)
      .then(() => toast.success(d.userDashboard.codeCopied));
  };

  return (
    <ConsumerFlowShell
      stepKey="dashboard"
      stepNumber={2}
      totalSteps={2}
      stepLabel={d.userDashboard.accessStep}
      headline={d.userDashboard.headline}
      subtitle={d.userDashboard.subtitle}
      scrollable
      showBack
      onBack={() => navigate({ to: "/user/register" })}
    >
      <p className="consumer-greeting">
        {d.userDashboard.hello}{" "}
        <span className="tabular-nums">•••• {phone ? phone.slice(-4) : "····"}</span>
      </p>

      <div className="consumer-panel mt-6">
        <div className="consumer-qr-wrap">
          <RadialCountdown seconds={secondsLeft} total={CYCLE} size={240} stroke={5}>
            {qrPayload ? (
              <QRCodeSVG
                value={qrPayload}
                size={160}
                bgColor="transparent"
                fgColor="#1a1a18"
                level="M"
              />
            ) : (
              <div className="h-[160px] w-[160px] animate-pulse rounded-xl bg-[var(--hair)]" />
            )}
          </RadialCountdown>
          <p className="consumer-qr-caption">{d.userDashboard.showQr}</p>
          <p className="consumer-qr-timer">
            {d.userDashboard.renewsIn.replace("{n}", String(secondsLeft))}
          </p>
          <button type="button" onClick={forceRefresh} className="consumer-qr-refresh">
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            {d.userDashboard.renewNow}
          </button>
        </div>
      </div>

      <div className="consumer-panel">
        <div className="consumer-panel-header">
          <Gift className="h-4 w-4 text-[var(--ink)]" aria-hidden />
          <h2 className="consumer-panel-title">{d.userDashboard.inviteFriends}</h2>
        </div>
        <p className="consumer-panel-body">{d.userDashboard.shareCode}</p>
        <div className="consumer-referral-row">
          <span className="consumer-referral-code">{referralCode || "REF-···-····"}</span>
          <button
            type="button"
            onClick={copyReferral}
            className="consumer-copy-btn"
            aria-label={d.userDashboard.codeCopied}
          >
            <Copy className="h-3.5 w-3.5" aria-hidden />
          </button>
        </div>
      </div>

      <div className="consumer-panel">
        <div className="consumer-panel-header">
          <Store className="h-4 w-4 text-[var(--ink)]" aria-hidden />
          <h2 className="consumer-panel-title">{d.userDashboard.myDiscounts}</h2>
        </div>
        <ul className="consumer-discount-list">
          {discounts.map((item) => (
            <li key={item.id} className="consumer-discount-item">
              <div className="min-w-0">
                <p className="consumer-discount-title">{item.title}</p>
                <p className="consumer-discount-business">
                  <Store className="h-3 w-3 shrink-0" aria-hidden />
                  {item.business}
                </p>
                <p className="consumer-discount-expires">
                  {d.userDashboard.expires} {item.expires}
                </p>
              </div>
              <span
                className={
                  item.active
                    ? "consumer-badge consumer-badge--active"
                    : "consumer-badge consumer-badge--warn"
                }
              >
                {item.active ? d.userDashboard.active : d.userDashboard.expiringSoon}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </ConsumerFlowShell>
  );
}
