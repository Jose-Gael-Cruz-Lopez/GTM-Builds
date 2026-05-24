import { cn } from "@/lib/utils";

/**
 * IsoScene — Kriss.AI-style framed illustration surface for empty states.
 * Pass an SVG/Lottie/Rive child. Frames it in cream with a dusty-rose backdrop.
 */
export function IsoScene({
  children,
  title,
  description,
  action,
  className,
}: {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[var(--color-cream)] px-6 py-12 text-center md:px-12",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            "radial-gradient(circle at 30% 20%, rgba(200,168,154,0.35), transparent 50%), radial-gradient(circle at 80% 80%, rgba(245,197,24,0.10), transparent 55%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto flex max-w-md flex-col items-center gap-4">
        {children && <div className="mb-2">{children}</div>}
        {title && <h3 className="display-md text-[color:var(--color-ink)]">{title}</h3>}
        {description && (
          <p className="text-sm text-[color:var(--color-ink-soft)] md:text-base">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    </div>
  );
}

// Default illustrated icons used across empty states
export function EmptyWalletGlyph() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden>
      <rect x="8" y="20" width="104" height="64" rx="14" fill="#F5C518" opacity="0.18" />
      <rect x="8" y="20" width="104" height="64" rx="14" stroke="#0A0F1E" strokeWidth="2" />
      <rect x="22" y="34" width="48" height="6" rx="3" fill="#0A0F1E" opacity="0.6" />
      <rect x="22" y="46" width="32" height="4" rx="2" fill="#0A0F1E" opacity="0.3" />
      <circle cx="92" cy="56" r="14" fill="#FF2D1A" opacity="0.15" />
      <circle cx="92" cy="56" r="14" stroke="#FF2D1A" strokeWidth="2" />
    </svg>
  );
}

export function NotFoundGlyph() {
  return (
    <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden>
      <circle cx="60" cy="48" r="38" fill="#C8A89A" opacity="0.25" />
      <path
        d="M40 60 Q60 40 80 60"
        stroke="#0A0F1E"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="48" cy="42" r="3" fill="#0A0F1E" />
      <circle cx="72" cy="42" r="3" fill="#0A0F1E" />
    </svg>
  );
}
