import { createFileRoute } from "@tanstack/react-router";
import { RouteError } from "@/components/RouteError";
import { EditorialNav } from "@/components/landing/EditorialNav";
import { CitrineBubble } from "@/components/landing/CitrineBubble";
import { Hero } from "@/components/landing/Hero";
import { ScrollStack } from "@/components/landing/ScrollStack";
import { AboutBlock } from "@/components/landing/AboutBlock";
import { RecentAddings } from "@/components/landing/RecentAddings";
import { EditorialFooter } from "@/components/landing/EditorialFooter";
import { ConsumerJoin } from "@/components/landing/ConsumerJoin";

export const Route = createFileRoute("/")({
  component: LandingPage,
  errorComponent: RouteError,
  head: () => ({
    meta: [
      { title: "NexoLeal · Hecho para volver. Una y otra vez." },
      {
        name: "description",
        content:
          "La plataforma de fidelidad y retención para cafés, salones y pequeños comercios en México. Sin apps. Sin tarjetas físicas. Solo conversaciones que vuelven.",
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
      <ConsumerJoin />
      <AboutBlock />
      <RecentAddings />
      <EditorialFooter />
      <CitrineBubble />
    </main>
  );
}
