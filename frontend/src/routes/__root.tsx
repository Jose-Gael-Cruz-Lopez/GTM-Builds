import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { NotFoundGlyph, IsoScene } from "@/components/ui/iso-scene";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-paper)] px-4">
      <IsoScene
        title="Página no encontrada"
        description="El enlace que seguiste ya no existe o nunca existió."
        action={
          <Link to="/" className="btn-signal text-sm">
            Volver al inicio
          </Link>
        }
      >
        <NotFoundGlyph />
      </IsoScene>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg-paper)] px-4">
      <IsoScene
        title="Algo salió mal"
        description="No pudimos cargar esta página. Intenta de nuevo o vuelve al inicio."
        action={
          <div className="flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                router.invalidate();
                reset();
              }}
              className="btn-signal text-sm"
            >
              Reintentar
            </button>
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-[color:var(--color-border)] px-5 py-2 text-sm font-medium hover:bg-current/5"
            >
              Ir al inicio
            </a>
          </div>
        }
      >
        <NotFoundGlyph />
      </IsoScene>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { title: "NexoLeal · Lealtad digital para PYMES" },
      {
        name: "description",
        content:
          "Convierte cada visita en una razón para volver. NexoLeal digitaliza la lealtad de barberías, veterinarias, cafeterías y más en toda Latinoamérica.",
      },
      { name: "theme-color", content: "#0D0D0D" },
      { property: "og:title", content: "NexoLeal · Lealtad digital para PYMES" },
      {
        property: "og:description",
        content:
          "Monedero digital, validación segura por QR y campañas con IA para que tus clientes regresen.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="light">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
