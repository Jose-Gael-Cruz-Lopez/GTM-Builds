import { useLocale } from "@/contexts/LocaleContext";

const SUPPORT_EMAIL = "hola@nexoleal.com";

export function EditorialFooter() {
  const { d } = useLocale();
  const c = d.landing.footerContact;
  const g = d.landing.footerGroups;

  const PRIMARY_LINKS = [
    { label: d.nav.product, href: "#producto" },
    { label: d.nav.cases, href: "#casos" },
    { label: d.nav.pricing, href: "#producto" },
    { label: d.nav.blog, href: "#diario" },
  ];

  const SECONDARY_LINKS = [
    { label: g.company.work, href: `mailto:${SUPPORT_EMAIL}` },
    { label: g.legal.terms, href: "/terms" },
    { label: g.legal.privacy, href: "/privacy" },
    { label: g.legal.cookies, href: "/privacy" },
  ];

  const CONTACT_BLOCKS = [
    {
      title: c.office,
      lines: [c.officeLine, SUPPORT_EMAIL],
      hrefs: [undefined, `mailto:${SUPPORT_EMAIL}`] as (string | undefined)[],
    },
    {
      title: c.support,
      lines: [c.supportLine, SUPPORT_EMAIL],
      hrefs: [undefined, `mailto:${SUPPORT_EMAIL}`] as (string | undefined)[],
    },
    {
      title: c.product,
      lines: [c.productLine],
      hrefs: ["/signup"] as (string | undefined)[],
    },
  ];

  return (
    <footer id="diario" className="editorial-footer">
      <div className="editorial-footer__inner">
        <div className="editorial-footer__contact-grid">
          {CONTACT_BLOCKS.map((block) => (
            <div key={block.title} className="editorial-footer__contact-block">
              <h3 className="editorial-footer__contact-title">{block.title}</h3>
              <div className="editorial-footer__contact-body">
                {block.lines.map((line, index) => {
                  const href = block.hrefs[index];
                  if (href) {
                    return (
                      <FooterLink key={line} href={href} variant="contact">
                        {line}
                      </FooterLink>
                    );
                  }
                  return <p key={line}>{line}</p>;
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="editorial-footer__rule" aria-hidden="true" />

        <div className="editorial-footer__main">
          <div className="editorial-footer__brand">
            <div className="editorial-footer__wordmark" aria-label="NexoLeal">
              NexoLeal<sup>®</sup>
            </div>
            <div className="editorial-footer__illustrations" aria-hidden="true">
              <img
                src="/landing/cloud/loyalty-card.svg"
                alt=""
                width={120}
                height={76}
                className="editorial-footer__illustration editorial-footer__illustration--card"
              />
              <img
                src="/landing/cloud/qr-code.svg"
                alt=""
                width={72}
                height={72}
                className="editorial-footer__illustration editorial-footer__illustration--qr"
              />
            </div>
          </div>

          <nav className="editorial-footer__nav" aria-label={d.landing.aboutAriaLabel}>
            <ul className="editorial-footer__nav-primary">
              {PRIMARY_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href} variant="primary">
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
            <ul className="editorial-footer__nav-secondary">
              {SECONDARY_LINKS.map((link) => (
                <li key={link.label}>
                  <FooterLink href={link.href} variant="secondary">
                    {link.label}
                  </FooterLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="editorial-footer__rule" aria-hidden="true" />

        <div className="editorial-footer__bottom">
          <div className="editorial-footer__social">
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
            <SocialGlyph href="https://linkedin.com" label="LinkedIn" viewBox="0 0 24 24">
              <path
                d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"
                fill="currentColor"
              />
              <rect width="4" height="12" x="2" y="9" fill="currentColor" />
              <circle cx="4" cy="4" r="2" fill="currentColor" />
            </SocialGlyph>
            <SocialGlyph href="https://x.com" label="X">
              <path
                d="M4 4l5.4 7L4.3 16h1.4l4.5-4.4L13.4 16h2.6l-5.7-7.5L15.5 4h-1.4l-4.1 4L6.6 4H4z"
                fill="currentColor"
              />
            </SocialGlyph>
          </div>

          <div className="editorial-footer__meta">
            <span>{d.landing.footerMadeIn}</span>
            <span>{d.landing.footerRights}</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({
  href,
  children,
  variant,
}: {
  href: string;
  children: React.ReactNode;
  variant: "primary" | "secondary" | "contact";
}) {
  return (
    <a href={href} className={`editorial-footer__link editorial-footer__link--${variant}`}>
      {children}
    </a>
  );
}

function SocialGlyph({
  href,
  label,
  children,
  viewBox = "0 0 20 20",
}: {
  href: string;
  label: string;
  children: React.ReactNode;
  viewBox?: string;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="editorial-footer__social-link"
    >
      <svg
        width="20"
        height="20"
        viewBox={viewBox}
        aria-hidden="true"
        className="editorial-footer__social-icon"
      >
        {children}
      </svg>
    </a>
  );
}
