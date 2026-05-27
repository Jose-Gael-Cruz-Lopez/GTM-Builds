import { Sparkles, Users, TrendingUp, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IsoScene } from "@/components/ui/iso-scene";

export function CampaignEmptyState({ onGenerate }: { onGenerate: () => void }) {
  return (
    <IsoScene
      title="Genera tu primera campaña en 60 segundos"
      description="Elige un grupo de clientes, describe qué quieres lograr y la IA diseña el descuento o promoción ideal para enviar a todos ellos."
      action={
        <Button size="lg" onClick={onGenerate}>
          <Sparkles className="h-4 w-4" /> Generar con IA
        </Button>
      }
      className="mt-8"
    >
      <div className="relative mx-auto flex h-28 w-full max-w-xs items-end justify-center gap-3">
        <SegmentIllustration icon={Users} color="var(--status-warn)" delay={0} />
        <SegmentIllustration icon={Heart} color="var(--status-good)" delay={1} />
        <SegmentIllustration icon={TrendingUp} color="var(--health)" delay={2} />
      </div>
    </IsoScene>
  );
}

function SegmentIllustration({
  icon: Icon,
  color,
  delay,
}: {
  icon: typeof Users;
  color: string;
  delay: number;
}) {
  return (
    <div
      className="flex h-20 w-16 flex-col items-center justify-center rounded-[var(--radius)] border bg-white shadow-[var(--shadow-soft)]"
      style={{ transform: `translateY(${delay * -4}px)` }}
    >
      <span
        className="mb-1 grid h-8 w-8 place-items-center rounded-full"
        style={{ backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
      >
        <Icon className="h-4 w-4" style={{ color }} />
      </span>
      <span className="h-1.5 w-8 rounded-full bg-[var(--surface-soft)]" />
    </div>
  );
}
