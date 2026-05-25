import { useLocale } from "@/contexts/LocaleContext";

export function EditorialFooter() {
  const { d } = useLocale();

  const LINK_GROUPS = [
    {
      heading: d.landing.footerGroups.product.heading,
      links: [
        { label: d.landing.footerGroups.product.features, href: "#producto" },
        { label: d.landing.footerGroups.product.pricing, href: "#producto" },
        { label: d.landing.footerGroups.product.changes, href: "#diario" },
      ],
    },
    {
      heading: d.landing.footerGroups.company.heading,
      links: [
        { label: d.landing.footerGroups.company.about, href: "#producto" },
        { label: d.landing.footerGroups.company.diary, href: "#diario" },
        { label: d.landing.footerGroups.company.contact, href: "mailto:hola@nexoleal.com" },
        { label: d.landing.footerGroups.company.work, href: "mailto:hola@nexoleal.com" },
      ],
    },
    {
      heading: d.landing.footerGroups.legal.heading,
      links: [
        { label: d.landing.footerGroups.legal.terms, href: "/terms" },
        { label: d.landing.footerGroups.legal.privacy, href: "/privacy" },
        { label: d.landing.footerGroups.legal.cookies, href: "/privacy" },
      ],
    },
  ];

  return (
    <footer
      id="diario"
      style={{
        background: "var(--paper-warm)",
        padding: "clamp(3rem, 8vw, 6rem) clamp(1.5rem, 5vw, 5rem) clamp(2rem, 5vw, 4rem)",
        color: "var(--ink)",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "min(1280px, 92vw)" }}>
        <div className="grid gap-12 md:grid-cols-[1fr_auto]">
          {/* Left: oversized wordmark + tagline */}
          <div>
            <div
              className="font-display"
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 500,
                fontSize: "clamp(3.5rem, 12vw, 9rem)",
                lineHeight: 0.9,
                letterSpacing: "-0.035em",
                color: "var(--ink)",
              }}
            >
              NexoLeal<sup style={{ fontSize: "0.3em", verticalAlign: "super" }}>®</sup>
            </div>
            <div
              style={{
                marginTop: "0.5rem",
                fontFamily: "var(--font-sans)",
                fontSize: "0.875rem",
                color: "var(--ink-soft)",
              }}
            >
              {d.landing.footerMadeIn}
            </div>
          </div>

          {/* Right: link columns */}
          <div
            className="grid gap-x-12 gap-y-8 md:text-right"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(140px, 100%), max-content))",
            }}
          >
            {LINK_GROUPS.map((group) => (
              <div key={group.heading}>
                <div
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: "0.7rem",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--ink-soft)",
                    marginBottom: "0.875rem",
                  }}
                >
                  {group.heading}
                </div>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {group.links.map((l) => (
                    <li key={l.label} style={{ marginBottom: "0.4rem" }}>
                      <FooterLink href={l.href}>{l.label}</FooterLink>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Hairline */}
        <div
          aria-hidden="true"
          style={{
            height: "1px",
            background: "var(--hair)",
            margin: "clamp(2rem, 5vw, 4rem) 0",
          }}
        />

        {/* Fine print */}
        <div
          className="flex flex-wrap items-center justify-between gap-4"
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "0.75rem",
            color: "var(--ink-soft)",
          }}
        >
          <div>{d.landing.footerRights}</div>
          <div className="flex items-center gap-3">
            <SocialGlyph href="https://instagram.com" label="Instagram">
              <rect
                x="3"
                y="3"
                width="14"
                height="14"
                rx="4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <circle cx="10" cy="10" r="3.5" fill="none" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="14.4" cy="5.6" r="0.9" fill="currentColor" />
            </SocialGlyph>
            <SocialGlyph href="https://linkedin.com" label="LinkedIn">
              <rect
                x="3"
                y="3"
                width="14"
                height="14"
                rx="2.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <rect x="6" y="8" width="1.8" height="6.5" fill="currentColor" />
              <circle cx="6.9" cy="5.9" r="1.1" fill="currentColor" />
              <path
                d="M10 14.5V8.5h1.8v1c0.4-0.7 1.2-1.2 2.2-1.2 1.6 0 2.4 1 2.4 2.7v3.5h-1.8v-3.3c0-0.9-0.4-1.3-1.2-1.3-0.9 0-1.4 0.6-1.4 1.5v3.1H10z"
                fill="currentColor"
              />
            </SocialGlyph>
            <SocialGlyph href="https://x.com" label="X">
              <path
                d="M4 4l5.4 7L4.3 16h1.4l4.5-4.4L13.4 16h2.6l-5.7-7.5L15.5 4h-1.4l-4.1 4L6.6 4H4z"
                fill="currentColor"
              />
            </SocialGlyph>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-block focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        fontFamily: "var(--font-display)",
        fontWeight: 400,
        fontSize: "1rem",
        lineHeight: 1.8,
        color: "var(--ink)",
        textDecoration: "none",
        backgroundImage: "linear-gradient(currentColor, currentColor)",
        backgroundSize: "0 1px",
        backgroundPosition: "0 100%",
        backgroundRepeat: "no-repeat",
        transition: "background-size 220ms cubic-bezier(0.22, 1, 0.36, 1)",
        // @ts-expect-error css var
        "--tw-ring-color": "var(--ink)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundSize = "100% 1px";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundSize = "0 1px";
      }}
    >
      {children}
    </a>
  );
}

function SocialGlyph({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
      style={{
        width: 28,
        height: 28,
        borderRadius: "9999px",
        color: "var(--ink-soft)",
        transition: "color 180ms",
        // @ts-expect-error css var
        "--tw-ring-color": "var(--ink)",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "var(--ink)")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-soft)")}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        {children}
      </svg>
    </a>
  );
}
