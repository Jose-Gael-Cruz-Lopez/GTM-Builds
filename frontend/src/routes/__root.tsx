import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { RouteError } from "@/components/RouteError";
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

function ErrorComponent(props: { error: Error; reset: () => void }) {
  return <RouteError {...props} />;
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
      { property: "og:image", content: "/og-image.svg" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/og-image.svg" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/icons/icon-192.svg" },
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

  useEffect(() => {
    void import("@/lib/axe-dev").then((m) => m.initAxeDev());
    void import("@/lib/register-sw").then((m) => m.registerServiceWorker());
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-center" />
    </QueryClientProvider>
  );
}
