import { Sparkles } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="font-display font-semibold">NexoLeal</span>
          <span className="text-sm text-muted-foreground">
            · Lealtad digital para PYMES
          </span>
        </div>

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <a href="#como-funciona" className="hover:text-foreground">
            Cómo funciona
          </a>
          <a href="#beneficios" className="hover:text-foreground">
            Beneficios
          </a>
          <a href="#testimonios" className="hover:text-foreground">
            Testimonios
          </a>
          <a href="#cta" className="hover:text-foreground">
            Crear cuenta
          </a>
        </nav>

        <div className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} NexoLeal. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
