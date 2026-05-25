import { createFileRoute } from "@tanstack/react-router";
import { RouteError } from "@/components/RouteError";
import { EditorialNav } from "@/components/landing/EditorialNav";
import { Hero } from "@/components/landing/Hero";
import { ScrollStack } from "@/components/landing/ScrollStack";
import { AboutBlock } from "@/components/landing/AboutBlock";
import { RecentAddings } from "@/components/landing/RecentAddings";
import { EditorialFooter } from "@/components/landing/EditorialFooter";

export const Route = createFileRoute("/")({
  component: LandingPage,
  errorComponent: RouteError,
  head: () => ({
    meta: [
      { title: "NexoLeal · Tarjetas de sellos y QR para negocios locales" },
      {
        name: "description",
        content:
          "Plataforma de fidelidad digital para México: tarjetas de sellos en el celular, QR en mostrador y panel para tu equipo. Sin app propia ni tarjetas físicas.",
      },
    ],
  }),
});

function LandingPage() {
  return (
    <main data-surface="editorial">
      <EditorialNav />
      <Hero />
      <ScrollStack />
      <AboutBlock />
      <RecentAddings />
      <EditorialFooter />
    </main>
  );
}
