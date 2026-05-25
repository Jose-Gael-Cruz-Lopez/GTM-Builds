import { AlertCircle, CheckCircle2, Clock, Loader2, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { RewardParticles } from "./RewardParticles";
import { useLocale } from "@/contexts/LocaleContext";

export type ScanStatus =
  | { kind: "idle" }
  | { kind: "validating" }
  | {
      kind: "success-stamp";
      clientFirstName: string;
      stampsRemaining: number;
    }
  | { kind: "success-reward"; rewardDescription: string }
  | { kind: "error-expired" }
  | { kind: "error-used" }
  | { kind: "error-invalid-key"; message?: string }
  | { kind: "error-camera" }
  | { kind: "offline-queued"; count?: number };

interface ScanStatusPanelProps {
  status: ScanStatus;
  className?: string;
}

export function ScanStatusPanel({ status, className }: ScanStatusPanelProps) {
  const { d } = useLocale();
  const liveMessage = statusToLiveMessage(status, d.scan);

  return (
    <section
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "relative mx-4 mb-6 min-h-[88px] overflow-hidden rounded-[var(--radius-lg)] border border-white/8 bg-[color:var(--color-bg-elevated)] px-5 py-4",
        className,
      )}
    >
      <span className="sr-only">{liveMessage}</span>
      <StatusContent status={status} />
    </section>
  );
}

function StatusContent({ status }: { status: ScanStatus }) {
  const { d } = useLocale();

  switch (status.kind) {
    case "idle":
      return (
        <StatusRow chip={<Chip tone="neutral">{d.scan.idle}</Chip>}>
          <p className="text-sm text-[color:var(--color-cream)]/90">{d.scan.idleDetail}</p>
        </StatusRow>
      );

    case "validating":
      return (
        <StatusRow chip={<Chip tone="signal">{d.scan.validating}</Chip>}>
          <div className="flex items-center gap-3">
            <FourDotLoader />
            <p className="text-sm text-[color:var(--color-cream)]/80">{d.scan.validatingDetail}</p>
          </div>
        </StatusRow>
      );

    case "success-stamp":
      return (
        <StatusRow
          chip={
            <Chip tone="good" icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}>
              {d.scan.stampAdded.replace("{name}", status.clientFirstName)}
            </Chip>
          }
        >
          <p className="text-sm text-[color:var(--color-cream)]/75">
            {d.scan.stampsForReward.replace("{n}", String(status.stampsRemaining))}
          </p>
        </StatusRow>
      );

    case "success-reward":
      return (
        <div className="relative">
          <RewardParticles />
          <StatusRow
            chip={
              <Chip tone="celebrate" icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}>
                {d.scan.rewardReady.replace("{description}", status.rewardDescription)}
              </Chip>
            }
          />
        </div>
      );

    case "error-expired":
      return (
        <StatusRow
          chip={
            <Chip tone="warn" icon={<Clock className="h-3.5 w-3.5" aria-hidden />}>
              {d.scan.codeExpired}
            </Chip>
          }
        />
      );

    case "error-used":
      return (
        <StatusRow
          chip={
            <Chip tone="risk" icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden />}>
              {d.scan.codeUsed}
            </Chip>
          }
        />
      );

    case "error-invalid-key":
      return (
        <StatusRow
          chip={
            <Chip tone="risk" icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden />}>
              {status.message ?? d.scan.invalidKey}
            </Chip>
          }
        />
      );

    case "error-camera":
      return (
        <StatusRow
          chip={
            <Chip tone="risk" icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden />}>
              {d.scan.cameraDenied}
            </Chip>
          }
        />
      );

    case "offline-queued":
      return (
        <StatusRow
          chip={
            <Chip tone="warn" icon={<WifiOff className="h-3.5 w-3.5" aria-hidden />}>
              {d.scan.offlineQueued}
              {status.count ? ` (${status.count})` : ""}
            </Chip>
          }
        >
          <p className="text-sm text-[color:var(--color-cream)]/75">{d.scan.offlineDetail}</p>
        </StatusRow>
      );
  }
}

function StatusRow({ chip, children }: { chip: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      {chip}
      {children}
    </div>
  );
}

type ChipTone = "neutral" | "signal" | "good" | "celebrate" | "warn" | "risk";

function Chip({
  tone,
  icon,
  children,
}: {
  tone: ChipTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  const tones: Record<ChipTone, string> = {
    neutral: "bg-white/8 text-[color:var(--color-cream)]",
    signal: "bg-[color:var(--color-signal)]/15 text-[color:var(--color-signal)]",
    good: "bg-[color:var(--color-status-good)]/15 text-[color:var(--color-status-good)]",
    celebrate: "bg-[color:var(--color-celebrate)]/15 text-[color:var(--color-celebrate)]",
    warn: "bg-[color:var(--color-status-warn)]/15 text-[color:var(--color-status-warn)]",
    risk: "bg-[color:var(--color-status-risk)]/15 text-[color:var(--color-status-risk)]",
  };

  return (
    <span
      className={cn(
        "inline-flex min-h-14 max-w-full items-center gap-2 rounded-[var(--radius-pill)] px-4 py-3 text-sm font-medium leading-snug",
        tones[tone],
      )}
    >
      {icon}
      <span>{children}</span>
      {tone === "signal" && (
        <Loader2 className="h-4 w-4 shrink-0 animate-spin opacity-80" aria-hidden />
      )}
    </span>
  );
}

function FourDotLoader() {
  return (
    <span className="inline-flex gap-1" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="h-2 w-2 rounded-full bg-[color:var(--color-signal)] animate-pulse"
          style={{ animationDelay: `${i * 120}ms` }}
        />
      ))}
    </span>
  );
}

type ScanDict = {
  liveIdle: string;
  liveValidating: string;
  liveStamp: string;
  liveReward: string;
  liveExpired: string;
  liveUsed: string;
  liveInvalidKey: string;
  liveCameraDenied: string;
  liveOffline: string;
  invalidKey: string;
};

function statusToLiveMessage(status: ScanStatus, scan: ScanDict): string {
  switch (status.kind) {
    case "idle":
      return scan.liveIdle;
    case "validating":
      return scan.liveValidating;
    case "success-stamp":
      return scan.liveStamp
        .replace("{name}", status.clientFirstName)
        .replace("{n}", String(status.stampsRemaining));
    case "success-reward":
      return scan.liveReward.replace("{description}", status.rewardDescription);
    case "error-expired":
      return scan.liveExpired;
    case "error-used":
      return scan.liveUsed;
    case "error-invalid-key":
      return status.message ?? scan.liveInvalidKey;
    case "error-camera":
      return scan.liveCameraDenied;
    case "offline-queued":
      return scan.liveOffline;
  }
}
