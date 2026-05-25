import { useState } from "react";
import { Link } from "@tanstack/react-router";
import type { FileRouteTypes } from "@/routeTree.gen";
import {
  BarChart3,
  Building2,
  Gift,
  LayoutDashboard,
  LogOut,
  Megaphone,
  Menu,
  Settings,
  Sparkles,
  TrendingUp,
  UserPlus,
  Users,
  Footprints,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export type DashboardNavId =
  | "resumen"
  | "sucursales"
  | "clientes"
  | "visitas"
  | "recompensas"
  | "campanas"
  | "marketing"
  | "config";

interface DashboardShellProps {
  businessId: string;
  businessName?: string | null;
  plan?: "free" | "pro" | null;
  activeNav?: DashboardNavId;
  ownerFirstName?: string;
  children: React.ReactNode;
}

const NAV_ITEMS: {
  id: DashboardNavId;
  label: string;
  icon: typeof LayoutDashboard;
  to: FileRouteTypes["to"];
  mobileTab?: boolean;
}[] = [
  {
    id: "resumen",
    label: "Resumen",
    icon: LayoutDashboard,
    to: "/dashboard/$businessId",
    mobileTab: true,
  },
  {
    id: "sucursales",
    label: "Sucursales",
    icon: Building2,
    to: "/dashboard/$businessId/sucursales",
    mobileTab: false,
  },
  {
    id: "clientes",
    label: "Clientes",
    icon: Users,
    to: "/dashboard/$businessId/clients",
    mobileTab: true,
  },
  {
    id: "visitas",
    label: "Visitas",
    icon: Footprints,
    to: "/dashboard/$businessId/visits",
    mobileTab: true,
  },
  {
    id: "recompensas",
    label: "Recompensas",
    icon: Gift,
    to: "/dashboard/$businessId/redemptions",
  },
  {
    id: "campanas",
    label: "Campañas",
    icon: Megaphone,
    to: "/campaigns/$businessId",
    mobileTab: true,
  },
  {
    id: "marketing",
    label: "Marketing",
    icon: TrendingUp,
    to: "/dashboard/$businessId/marketing",
    mobileTab: false,
  },
  {
    id: "config",
    label: "Configuración",
    icon: Settings,
    to: "/settings/$businessId",
    mobileTab: true,
  },
];

function formatToday(): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

function copyJoinUrl(businessId: string) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${businessId}`
      : `/join/${businessId}`;
  navigator.clipboard.writeText(url).then(
    () => toast.success("Enlace de invitación copiado"),
    () => toast.error("No pudimos copiar el enlace"),
  );
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
  return (
    <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
      {NAV_ITEMS.map(({ id, label, icon: Icon, to }) => {
        const active = activeNav === id;
        return (
          <Link
            key={id}
            to={to}
            params={{ businessId }}
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
            {label}
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
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}

function SidebarBrand({
  businessId,
  businessName,
  plan,
}: {
  businessId: string;
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="mt-4 w-full gap-2 border-[color:var(--color-border)] bg-[var(--color-cream)]/50 text-xs"
        onClick={() => copyJoinUrl(businessId)}
      >
        <UserPlus className="h-3.5 w-3.5" aria-hidden />
        Invitar clientes
      </Button>
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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mobileTabs = NAV_ITEMS.filter((item) => item.mobileTab);

  return (
    <div className="min-h-screen bg-[var(--color-bg-paper)] text-[color:var(--color-ink)]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[240px] flex-col border-r border-[color:var(--color-border)] bg-[var(--color-bg-paper)] lg:flex">
        <SidebarBrand businessId={businessId} businessName={businessName} plan={plan} />
        <SidebarNav businessId={businessId} activeNav={activeNav} />
      </aside>

      <div className="lg:pl-[240px]">
        {/* Top bar */}
        <header className="sticky top-0 z-20 border-b border-[color:var(--color-border)] bg-[rgba(249,246,239,0.92)] backdrop-blur-md">
          <div className="flex items-center justify-between gap-4 px-4 py-4 md:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="lg:hidden"
                    aria-label="Abrir menú"
                  >
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[280px] p-0">
                  <SidebarBrand businessId={businessId} businessName={businessName} plan={plan} />
                  <SidebarNav
                    businessId={businessId}
                    activeNav={activeNav}
                    onNavigate={() => setDrawerOpen(false)}
                  />
                </SheetContent>
              </Sheet>

              <div>
                <h1 className="font-display text-xl font-semibold tracking-tight md:text-2xl">
                  Hola, {ownerFirstName ?? "equipo"}
                </h1>
                <p className="text-sm capitalize text-[color:var(--color-ink-soft)]">
                  {formatToday()}
                </p>
              </div>
            </div>

            <Link
              to="/campaigns/$businessId"
              params={{ businessId }}
              search={{ tab: "all", action: "generate" }}
              className="btn-signal hidden items-center gap-2 text-sm sm:inline-flex"
            >
              <BarChart3 className="h-4 w-4" aria-hidden />
              <span className="hidden md:inline">Generar campaña con IA</span>
              <span className="md:hidden">Campaña IA</span>
            </Link>
          </div>
        </header>

        <main className="px-4 py-6 pb-24 md:px-6 lg:px-8 lg:py-8 lg:pb-8">{children}</main>
      </div>

      {/* Mobile bottom tab nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--color-border)] bg-[var(--color-bg-paper)] lg:hidden"
        aria-label="Navegación principal"
      >
        <div className="grid grid-cols-5">
          {mobileTabs.map(({ id, label, icon: Icon, to }) => {
            const active = activeNav === id;
            return (
              <Link
                key={id}
                to={to}
                params={{ businessId }}
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
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
