import { Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { Sparkles, LogOut, User } from "lucide-react";
import { signOut } from "@/lib/auth";
import { useSession } from "@/hooks/use-session";
import { useOwnedBusiness } from "@/hooks/use-owned-business";
import { cn } from "@/lib/utils";
import { useLocale } from "@/contexts/LocaleContext";

interface AppShellProps {
  children: React.ReactNode;
  variant?: "light" | "dark";
  showNav?: boolean;
  className?: string;
}

/**
 * AppShell — unified shell used by every route.
 * `light`  = paper background (landing, dashboard, settings)
 * `dark`   = near-black background (wallet, scanner)
 */
export function AppShell({
  children,
  variant = "light",
  showNav = true,
  className,
}: AppShellProps) {
  const { d } = useLocale();

  useEffect(() => {
    document.documentElement.dataset.theme = variant === "dark" ? "dark" : "light";
    return () => {
      document.documentElement.dataset.theme = "light";
    };
  }, [variant]);

  const session = useSession();
  const { businessId } = useOwnedBusiness();
  const isAuthed = !!session?.user;

  return (
    <div
      className={cn(
        "min-h-screen",
        variant === "dark"
          ? "bg-[var(--color-bg-base)] text-[var(--color-cream)]"
          : "bg-[var(--color-bg-paper)] text-[var(--color-ink)]",
        className,
      )}
    >
      {showNav && (
        <header
          className={cn(
            "sticky top-0 z-40 backdrop-blur-md",
            variant === "dark"
              ? "bg-[rgba(13,13,13,0.7)] border-b border-white/5"
              : "bg-[rgba(249,246,239,0.8)] border-b border-[color:var(--color-border)]",
          )}
        >
          <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
            <Link to="/" className="flex items-center gap-2 font-display text-xl tracking-tight">
              <Sparkles className="h-5 w-5 text-[color:var(--color-signal)]" />
              <span className="font-semibold">NexoLeal</span>
            </Link>

            <div className="flex items-center gap-3">
              {isAuthed ? (
                <>
                  {businessId ? (
                    <Link
                      to="/dashboard/$businessId"
                      params={{ businessId }}
                      className="text-sm font-medium hover:opacity-80"
                    >
                      {d.appShell.myPanel}
                    </Link>
                  ) : (
                    <Link to="/wallet" className="text-sm font-medium hover:opacity-80">
                      {d.appShell.myWallet}
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => signOut().then(() => (window.location.href = "/"))}
                    className="inline-flex items-center gap-1 rounded-full border border-current/10 px-3 py-1.5 text-xs font-medium hover:bg-current/5"
                    aria-label={d.appShell.signOutLabel}
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    {d.appShell.signOut}
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-sm font-medium hover:opacity-80">
                    {d.appShell.signIn}
                  </Link>
                  <Link to="/signup" className="btn-signal text-sm">
                    {d.appShell.createAccount}
                  </Link>
                </>
              )}
            </div>
          </nav>
        </header>
      )}
      <main>{children}</main>
    </div>
  );
}

/** Convenience aliases matching the prompt-pack naming. */
export const AppShellLight = (p: Omit<AppShellProps, "variant">) => (
  <AppShell {...p} variant="light" />
);
export const AppShellDark = (p: Omit<AppShellProps, "variant">) => (
  <AppShell {...p} variant="dark" />
);

/** UserMenu helper (used inside surfaces that already have their own headers). */
export function UserMenu() {
  const { d } = useLocale();
  return (
    <button
      type="button"
      onClick={() => signOut().then(() => (window.location.href = "/"))}
      className="inline-flex items-center gap-2 rounded-full border border-current/10 px-3 py-1.5 text-xs hover:bg-current/5"
    >
      <User className="h-3.5 w-3.5" /> {d.appShell.myAccount}
    </button>
  );
}
