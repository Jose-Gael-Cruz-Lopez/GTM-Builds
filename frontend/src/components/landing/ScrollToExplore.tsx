type Props = {
  label?: string;
  tone?: "light" | "dark";
  className?: string;
};

export function ScrollToExplore({
  label = "Desplaza para explorar",
  tone = "dark",
  className = "",
}: Props) {
  const color = tone === "light" ? "rgba(255, 255, 255, 0.85)" : "var(--ink-soft)";
  return (
    <div
      className={`pointer-events-none inline-flex items-center gap-2 ${className}`}
      aria-hidden="true"
      style={{
        fontFamily: "var(--font-sans)",
        fontSize: "0.75rem",
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color,
      }}
    >
      <span>{label}</span>
      <span className="arrow-bounce inline-flex">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path
            d="M7 2v9M3 7.5L7 11.5L11 7.5"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
