import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { FileRouteTypes } from "@/routeTree.gen";
import {
  Building2,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  Users,
  Footprints,
  Scan,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { useLocale } from "@/contexts/LocaleContext";
import type { Dictionary } from "@/lib/i18n";

export type DashboardNavId =
  | "resumen"
  | "sucursales"
  | "clientes"
  | "visitas"
  | "escaner"
  | "config"
  | "recompensas"
  | "marketing"
  | "campanas";

interface DashboardShellProps {
  businessId: string;
  businessName?: string | null;
  plan?: "free" | "pro" | null;
  activeNav?: DashboardNavId;
  ownerFirstName?: string;
  children: React.ReactNode;
}

const NAV_ITEM_DEFS: {
  id: DashboardNavId;
  icon: typeof LayoutDashboard;
  to: FileRouteTypes["to"];
  mobileTab?: boolean;
  label?: string;
}[] = [
  {
    id: "resumen",
    icon: LayoutDashboard,
    to: "/dashboard/$businessId",
    mobileTab: true,
  },
  {
    id: "sucursales",
    icon: Building2,
    to: "/dashboard/$businessId/sucursales",
    mobileTab: false,
  },
  {
    id: "clientes",
    icon: Users,
    to: "/dashboard/$businessId/clients",
    mobileTab: true,
  },
  {
    id: "visitas",
    icon: Footprints,
    to: "/dashboard/$businessId/visits",
    mobileTab: true,
  },
  {
    id: "escaner",
    icon: Scan,
    to: "/scan",
    mobileTab: true,
  },
  {
    id: "config",
    icon: Settings,
    to: "/settings/$businessId",
    mobileTab: false,
  },
];

function navLabel(
  id: DashboardNavId,
  nav: Dictionary["dashboard"]["nav"],
  fallback?: string,
): string {
  return fallback ?? nav[id as keyof Dictionary["dashboard"]["nav"]] ?? id;
}

function formatToday(locale: string): string {
  return new Intl.DateTimeFormat(locale === "es" ? "es-MX" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function SidebarNav({
  businessId,
  activeNav,
  onNavigate,
}: {
  businessId: string;
  activeNav: DashboardNavId;
  onNavigate?: () => void;
}) {
  const { d } = useLocale();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV_ITEM_DEFS.map(({ id, icon: Icon, to, label }) => {
        const active = activeNav === id;
        const linkProps =
          typeof to === "string" && to.includes("$businessId")
            ? { to, params: { businessId } as { businessId: string } }
            : { to };
        return (
          <Link
            key={id}
            {...linkProps}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium transition-colors duration-[var(--duration)] ease-[var(--ease-out-expo)]",
              active
                ? "bg-[var(--color-cream)] text-[color:var(--color-ink)] shadow-[var(--shadow-soft)]"
                : "text-[color:var(--color-ink-soft)] hover:bg-[var(--color-cream)]/60 hover:text-[color:var(--color-ink)]",
            )}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {navLabel(id, d.dashboard.nav, label)}
          </Link>
        );
      })}
      <div className="mt-auto border-t border-[color:var(--color-border)] pt-4">
        <button
          type="button"
          onClick={() => signOut().then(() => (window.location.href = "/login"))}
          className="flex w-full items-center gap-3 rounded-[var(--radius)] px-3 py-2.5 text-sm font-medium text-[color:var(--color-ink-soft)] transition-colors hover:bg-[var(--color-cream)]/60 hover:text-[color:var(--color-ink)]"
        >
          <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          {d.dashboard.nav.signOut}
        </button>
      </div>
    </nav>
  );
}

function SidebarBrand({
  businessName,
  plan,
}: {
  businessName?: string | null;
  plan?: "free" | "pro" | null;
}) {
  return (
    <div className="border-b border-[color:var(--color-border)] px-4 py-5">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--radius)] bg-[var(--color-signal)] text-[color:var(--color-ink)]">
          <Sparkles className="h-5 w-5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          {businessName ? (
            <p className="truncate font-display text-sm font-semibold text-[color:var(--color-ink)]">
              {businessName}
            </p>
          ) : (
            <div className="h-4 w-28 shimmer rounded" />
          )}
          <Badge variant="secondary" className="mt-1 h-5 px-2 text-[10px] uppercase tracking-wide">
            {plan === "pro" ? "Pro" : "Free"}
          </Badge>
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  businessId,
  businessName,
  plan,
  activeNav = "resumen",
  ownerFirstName,
  children,
}: DashboardShellProps) {
  const { d, locale } = useLocale();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mobileTabs = useMemo(() => NAV_ITEM_DEFS.filter((item) => item.mobileTab), []);

  return (
    <div className="min-h-screen bg-[var(--color-bg-paper)] text-[color:var(--color-ink)]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-[color:var(--color-border)] bg-[var(--color-bg-paper)] lg:flex">
        <SidebarBrand businessName={businessName} plan={plan} />
        <SidebarNav businessId={businessId} activeNav={activeNav} />
      </aside>

      <div className="lg:pl-[240px]">
        <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[rgba(249,246,239,0.92)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    aria-label={d.dashboard.openMenu}
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SidebarBrand businessName={businessName} plan={plan} />
                  <SidebarNav
                    businessId={businessId}
                    activeNav={activeNav}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                </SheetContent>
              </Sheet>

              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
                  {d.dashboard.hello} {ownerFirstName ?? "equipo"}
                </h1>
                <p className="text-sm capitalize text-[color:var(--color-ink-soft)]">
                  {formatToday(locale)}
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 pb-24 md:px-6 lg:px-8 lg:py-8 lg:pb-8">{children}</main>
      </div>

      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--color-border)] bg-[var(--color-bg-paper)] lg:hidden"
        aria-label={d.dashboard.openMenu}
      >
        <div className="grid grid-cols-4">
          {mobileTabs.map(({ id, icon: Icon, to, label }) => {
            const active = activeNav === id;
            const linkProps =
              typeof to === "string" && to.includes("$businessId")
                ? { to, params: { businessId } as { businessId: string } }
                : { to };
            return (
              <Link
                key={id}
                {...linkProps}
                className={cn(
                  "flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-medium transition-colors",
                  active ? "text-[color:var(--color-ink)]" : "text-[color:var(--color-ink-soft)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon
                  className={cn("h-5 w-5", active && "text-[color:var(--color-signal)]")}
                  aria-hidden
                />
                {navLabel(id, d.dashboard.nav, label)}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
