import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { tokens } from "@/lib/theme";
import { cn } from "@/lib/utils";

// Wider preset palette so business owners can pick a color closer to their
// brand. Theme tokens first (keep brand consistency), then a curated hue
// spread. Anything outside these is still reachable via the hex input below.
const PRESETS = [
  { id: "ink", label: "Tinta", color: tokens.color.ink },
  { id: "signal", label: "Señal", color: tokens.color.signal },
  { id: "celebrate", label: "Celebrar", color: tokens.color.celebrate },
  { id: "health", label: "Salud", color: tokens.color.health },
  { id: "scanner", label: "Rosa", color: tokens.color.scannerWarm },
  { id: "blue", label: "Azul", color: tokens.color.dataBlue },
  { id: "good", label: "Verde", color: tokens.color.statusGood },
  { id: "warn", label: "Ámbar", color: tokens.color.statusWarn },
  { id: "risk", label: "Rojo", color: tokens.color.statusRisk },
  { id: "rose", label: "Rosa fuerte", color: "#EC4899" },
  { id: "purple", label: "Morado", color: "#8B5CF6" },
  { id: "indigo", label: "Índigo", color: "#6366F1" },
  { id: "cyan", label: "Cian", color: "#06B6D4" },
  { id: "teal", label: "Verde azulado", color: "#14B8A6" },
  { id: "lime", label: "Lima", color: "#84CC16" },
  { id: "orange", label: "Naranja", color: "#F97316" },
  { id: "slate", label: "Pizarra", color: "#475569" },
] as const;

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
}

function isValidHex(hex: string) {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex);
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <div className="space-y-3">
      <Label>Color principal</Label>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-label={preset.label}
            aria-pressed={value.toLowerCase() === preset.color.toLowerCase()}
            onClick={() => onChange(preset.color)}
            className={cn(
              "h-10 w-10 rounded-full border-2 transition-transform hover:scale-105",
              value.toLowerCase() === preset.color.toLowerCase()
                ? "border-[var(--color-ink)] ring-2 ring-[var(--color-signal)] ring-offset-2"
                : "border-transparent",
            )}
            style={{ backgroundColor: preset.color }}
          />
        ))}
      </div>
      <div className="flex items-center gap-3">
        <div
          className="h-10 w-10 shrink-0 rounded-lg border border-[var(--border)]"
          style={{ backgroundColor: isValidHex(value) ? value : tokens.color.signal }}
        />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#F5C518"
          maxLength={7}
          aria-describedby="color-hint"
          className="font-mono uppercase"
        />
      </div>
      <p id="color-hint" className="text-xs text-[color:var(--color-ink-soft)]">
        Este color aparece en sellos y detalles de la tarjeta del cliente.
      </p>
    </div>
  );
}
