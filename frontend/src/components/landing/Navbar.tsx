import { Button } from "@/components/ui/button";
import { useNavigate } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useSession } from "@/hooks/use-session";
import { signOut } from "@/lib/auth";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";

export function Navbar() {
  const { session, user } = useSession();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    await navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-white backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <a
          href="#top"
          className="flex items-center gap-2 text-black hover:text-[var(--primary)] transition-colors"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display text-lg font-semibold tracking-tight">NexoLeal</span>
        </a>

        <nav className="hidden items-center gap-8 text-sm font-medium text-black md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-[var(--primary)]">
            Cómo funciona
          </a>
          <a href="#beneficios" className="transition-colors hover:text-[var(--primary)]">
            Beneficios
          </a>
          <a href="#testimonios" className="transition-colors hover:text-[var(--primary)]">
            Testimonios
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {session && user ? (
            <>
              <span
                className="hidden max-w-[180px] truncate text-sm text-muted sm:inline-block"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="text-black hover:bg-transparent hover:text-[var(--primary)]"
                onClick={handleSignOut}
              >
                Cerrar sesión
              </Button>
            </>
          ) : (
            <GoogleSignInButton
              intent="business"
              source="login"
              label="Entrar con Google"
              className="btn-signal h-9 px-4 text-sm"
            />
          )}
        </div>
      </div>
    </header>
  );
}
