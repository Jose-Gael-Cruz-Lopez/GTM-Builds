import { Sparkles, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { Button } from "@/components/ui/button";

export interface DashboardHeaderProps {
  businessName?: string;
  businessId: string;
}

export function DashboardHeader({ businessName, businessId }: DashboardHeaderProps) {
  const { user } = useSession();

  async function handleSignOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("nexoleal:current-business-id");
          localStorage.removeItem("nexoleal:staff-key");
        } catch {
          // ignore storage errors (private mode, SSR, etc.)
        }
        window.location.href = "/login";
      }
    }
  }

  return (
    <header className="border-b bg-white">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <a
          href={`/dashboard/${businessId}`}
          className="flex items-center gap-2 text-black"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="font-display text-lg font-semibold">NexoLeal</span>
            {businessName ? (
              <span className="text-xs text-muted">{businessName}</span>
            ) : (
              <span className="h-3 w-24 animate-pulse rounded bg-muted/30" />
            )}
          </div>
        </a>

        <div className="flex items-center gap-3">
          {user?.email ? (
            <span className="hidden text-sm text-muted sm:inline">{user.email}</span>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesión</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
