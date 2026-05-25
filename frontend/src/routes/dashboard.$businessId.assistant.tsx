import { RouteError } from "@/components/RouteError";
import { createFileRoute } from "@tanstack/react-router";

import { AIAssistant } from "@/components/assistant/AIAssistant";
import { requireSession } from "@/lib/auth-guards";

export const Route = createFileRoute("/dashboard/$businessId/assistant")({
  beforeLoad: async ({ params, location }) => {
    await requireSession(location.pathname || `/dashboard/${params.businessId}/assistant`);
  },
  component: AssistantPage,
  errorComponent: RouteError,
  head: () => ({
    meta: [
      { title: "Asistente IA · NexoLeal" },
      {
        name: "description",
        content:
          "Analiza visitas recientes, segmenta clientes y crea campañas con recomendaciones de IA.",
      },
    ],
  }),
});

function AssistantPage() {
  const { businessId } = Route.useParams();

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[var(--color-bg-paper)]">
      <AIAssistant businessId={businessId} />
    </div>
  );
}
