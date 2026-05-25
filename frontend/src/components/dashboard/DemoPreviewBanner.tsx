import { Sparkles } from "lucide-react";

export function DemoPreviewBanner() {
  return (
    <div
      className="mb-6 flex gap-3 rounded-[var(--radius-lg)] border border-[color:var(--color-border)] bg-[color-mix(in_srgb,var(--color-signal)_12%,var(--color-cream))] px-4 py-3 md:px-5 md:py-4"
      role="status"
    >
      <Sparkles
        className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-ink)]"
        aria-hidden
      />
      <div>
        <p className="text-sm font-medium text-[color:var(--color-ink)]">
          Vista previa con datos de ejemplo
        </p>
        <p className="mt-0.5 text-xs text-[color:var(--color-ink-soft)]">
          Así se verá tu panel cuando empieces a registrar visitas. Comparte tu QR en mostrador
          para reemplazar estos números con tus métricas reales.
        </p>
      </div>
    </div>
  );
}
