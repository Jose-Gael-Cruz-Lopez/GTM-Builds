import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLocale } from "@/contexts/LocaleContext";
import { LOCALES, type Locale } from "@/lib/i18n";

const FLAG: Record<Locale, string> = { es: "🇲🇽", en: "🇺🇸" };
const CODE: Record<Locale, string> = { es: "ES", en: "EN" };

interface LocaleSwitcherProps {
  /** `pill` wraps in the frosted-glass pill used in the desktop nav;
   *  `ghost` renders just the label + chevron (for mobile or compact slots). */
  variant?: "pill" | "ghost";
  tone?: "light" | "dark";
}

export function LocaleSwitcher({ variant = "pill", tone = "dark" }: LocaleSwitcherProps) {
  const { locale, setLocale, d } = useLocale();
  const ink = tone === "light" ? "rgba(255, 255, 255, 0.96)" : "var(--ink)";
  const pillBg = tone === "light" ? "rgba(0, 0, 0, 0.34)" : "rgba(255, 255, 255, 0.92)";
  const pillBorder =
    tone === "light" ? "1px solid rgba(255, 255, 255, 0.18)" : "1px solid var(--hair)";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={d.locale.label}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: ink,
            cursor: "pointer",
            ...(variant === "pill" && {
              background: pillBg,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: pillBorder,
              borderRadius: "9999px",
              padding: "0.5rem 0.875rem",
            }),
          }}
        >
          {CODE[locale]} <span aria-hidden="true">▾</span>
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" style={{ minWidth: "9rem" }}>
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => setLocale(l)}
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "0.8125rem",
              cursor: "pointer",
              fontWeight: l === locale ? 600 : 400,
              gap: "0.5rem",
            }}
          >
            <span aria-hidden="true">{FLAG[l]}</span>
            {d.locale[l]}
            {l === locale && (
              <span
                aria-hidden="true"
                style={{ marginLeft: "auto", opacity: 0.5, fontSize: "0.7rem" }}
              >
                ✓
              </span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
