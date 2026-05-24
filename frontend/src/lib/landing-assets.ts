export type CloudItem = {
  id: string;
  src: string;
  alt: string;
  w: number;
  h: number;
  top: string;
  left: string;
  scale: number;
  rot: number;
  driftSeconds: number;
  driftDelay: number;
  dx: number;
  dy: number;
  parallax: number;
};

/**
 * v2 layout — 16 items distributed around an empty center safe zone.
 * Safe zone (kept clear): top 28%–78%, left 24%–76%.
 * Items concentrate in 8 perimeter zones (TL, TC, TR, ML, MR, BL, BC, BR).
 * Sizes are tuned smaller than v1 to avoid crowding the editorial display H1.
 */
export const cloudItems: CloudItem[] = [
  // ──────────────── TOP-LEFT ────────────────
  {
    id: "loyalty-card",
    src: "/landing/cloud/loyalty-card.svg",
    alt: "Tarjeta de lealtad con sellos",
    w: 124,
    h: 86,
    top: "14%",
    left: "6%",
    scale: 1,
    rot: -6,
    driftSeconds: 12,
    driftDelay: 0,
    dx: 10,
    dy: -8,
    parallax: 0.55,
  },
  {
    id: "retention-arc",
    src: "/landing/cloud/retention-arc.svg",
    alt: "Curva de retención",
    w: 120,
    h: 72,
    top: "30%",
    left: "3%",
    scale: 0.9,
    rot: 4,
    driftSeconds: 11,
    driftDelay: 2.6,
    dx: 12,
    dy: 6,
    parallax: 0.45,
  },

  // ──────────────── TOP-CENTER ────────────────
  {
    id: "sparkle-tl",
    src: "/landing/cloud/sparkle.svg",
    alt: "",
    w: 36,
    h: 36,
    top: "8%",
    left: "32%",
    scale: 1,
    rot: 12,
    driftSeconds: 9,
    driftDelay: 1.4,
    dx: 4,
    dy: 6,
    parallax: 0.7,
  },
  {
    id: "heart-check",
    src: "/landing/cloud/heart-check.svg",
    alt: "Cliente fidelizado",
    w: 72,
    h: 68,
    top: "6%",
    left: "62%",
    scale: 0.9,
    rot: -4,
    driftSeconds: 10,
    driftDelay: 0.8,
    dx: -6,
    dy: 8,
    parallax: 0.5,
  },

  // ──────────────── TOP-RIGHT ────────────────
  {
    id: "qr-code",
    src: "/landing/cloud/qr-code.svg",
    alt: "Código QR",
    w: 78,
    h: 78,
    top: "12%",
    left: "82%",
    scale: 0.95,
    rot: 3,
    driftSeconds: 12,
    driftDelay: 1.8,
    dx: 6,
    dy: 8,
    parallax: 0.55,
  },
  {
    id: "dashboard-tile",
    src: "/landing/cloud/dashboard-tile.svg",
    alt: "Mosaico de métricas",
    w: 116,
    h: 80,
    top: "28%",
    left: "84%",
    scale: 0.9,
    rot: -3,
    driftSeconds: 13,
    driftDelay: 2.2,
    dx: -8,
    dy: -8,
    parallax: 0.5,
  },

  // ──────────────── MIDDLE-LEFT ────────────────
  {
    id: "phone-wallet",
    src: "/landing/cloud/phone-wallet.svg",
    alt: "Monedero en teléfono",
    w: 62,
    h: 102,
    top: "46%",
    left: "4%",
    scale: 0.9,
    rot: -8,
    driftSeconds: 14,
    driftDelay: 1.2,
    dx: 8,
    dy: 6,
    parallax: 0.65,
  },

  // ──────────────── MIDDLE-RIGHT ────────────────
  {
    id: "segment-ring",
    src: "/landing/cloud/segment-ring.svg",
    alt: "Anillo de segmentos",
    w: 76,
    h: 76,
    top: "50%",
    left: "88%",
    scale: 0.9,
    rot: -2,
    driftSeconds: 11,
    driftDelay: 3.0,
    dx: -6,
    dy: 10,
    parallax: 0.6,
  },

  // ──────────────── BOTTOM-LEFT ────────────────
  {
    id: "peso-coin",
    src: "/landing/cloud/peso-coin.svg",
    alt: "Moneda de peso",
    w: 64,
    h: 64,
    top: "72%",
    left: "6%",
    scale: 0.9,
    rot: -10,
    driftSeconds: 9,
    driftDelay: 0.2,
    dx: -8,
    dy: 10,
    parallax: 0.7,
  },
  {
    id: "stamp-cluster",
    src: "/landing/cloud/stamp-cluster.svg",
    alt: "Sellos acumulados",
    w: 86,
    h: 82,
    top: "82%",
    left: "16%",
    scale: 0.9,
    rot: 4,
    driftSeconds: 13,
    driftDelay: 1.6,
    dx: -10,
    dy: -10,
    parallax: 0.45,
  },

  // ──────────────── BOTTOM-CENTER ────────────────
  {
    id: "star-rating",
    src: "/landing/cloud/star-rating.svg",
    alt: "Calificación de clientes",
    w: 108,
    h: 32,
    top: "92%",
    left: "32%",
    scale: 1,
    rot: -2,
    driftSeconds: 10,
    driftDelay: 1.0,
    dx: 4,
    dy: -6,
    parallax: 0.4,
  },
  {
    id: "confetti-burst",
    src: "/landing/cloud/confetti-burst.svg",
    alt: "Celebración de recompensa",
    w: 72,
    h: 72,
    top: "84%",
    left: "56%",
    scale: 0.85,
    rot: 0,
    driftSeconds: 11,
    driftDelay: 2.0,
    dx: 8,
    dy: -8,
    parallax: 0.5,
  },

  // ──────────────── BOTTOM-RIGHT ────────────────
  {
    id: "gift-box",
    src: "/landing/cloud/gift-box.svg",
    alt: "Recompensa",
    w: 70,
    h: 70,
    top: "66%",
    left: "76%",
    scale: 0.85,
    rot: 6,
    driftSeconds: 12,
    driftDelay: 0.6,
    dx: -6,
    dy: 8,
    parallax: 0.55,
  },
  {
    id: "ticket",
    src: "/landing/cloud/ticket.svg",
    alt: "Recibo de compra",
    w: 60,
    h: 92,
    top: "70%",
    left: "92%",
    scale: 0.85,
    rot: 8,
    driftSeconds: 12,
    driftDelay: 1.4,
    dx: 6,
    dy: -10,
    parallax: 0.55,
  },
  {
    id: "whatsapp-bubble",
    src: "/landing/cloud/whatsapp-bubble.svg",
    alt: "Mensaje a cliente",
    w: 86,
    h: 76,
    top: "88%",
    left: "78%",
    scale: 0.85,
    rot: -5,
    driftSeconds: 10,
    driftDelay: 2.4,
    dx: -8,
    dy: -8,
    parallax: 0.5,
  },
  {
    id: "return-arrow",
    src: "/landing/cloud/return-arrow.svg",
    alt: "Cliente que regresa",
    w: 58,
    h: 58,
    top: "58%",
    left: "82%",
    scale: 0.9,
    rot: -10,
    driftSeconds: 11,
    driftDelay: 0.4,
    dx: -4,
    dy: -8,
    parallax: 0.6,
  },
];

// ============================================================
// Use case panels (scroll stack)
// ============================================================

export type UseCasePanel = {
  index: string;
  vertical: "cafeteria" | "retail" | "salon" | "restaurante" | "servicios";
  chipLabel: string;
  chipTone: "coral" | "sage" | "clay" | "mist" | "stone";
  iconSvg: string;
  headline: string;
  ctaLabel: string;
  ctaHref: string;
  bgImage: string;
  bgAlt: string;
  pdfCard?: {
    title: string;
    href: string;
    miniSvg: string;
  };
};

export const useCasePanels: UseCasePanel[] = [
  {
    index: "01",
    vertical: "cafeteria",
    chipLabel: "Cafetería",
    chipTone: "coral",
    iconSvg: "/landing/cloud/stamp-cluster.svg",
    headline: "Programas de fidelidad que devuelven al cliente, taza tras taza",
    ctaLabel: "Ver demo cafetería",
    ctaHref: "/wallet/demo",
    bgImage: "/landing/panels/cafeteria.jpg",
    bgAlt: "Barista preparando café en una cafetería de barrio",
    pdfCard: {
      title: "Guía Cafetería",
      href: "/landing/pdf/guia-cafeteria.pdf",
      miniSvg: "/landing/cloud/stamp-cluster.svg",
    },
  },
  {
    index: "02",
    vertical: "retail",
    chipLabel: "Retail",
    chipTone: "sage",
    iconSvg: "/landing/cloud/ticket.svg",
    headline: "Convierte la primera compra en la primera de muchas",
    ctaLabel: "Ver demo retail",
    ctaHref: "/wallet/demo",
    bgImage: "/landing/panels/retail.jpg",
    bgAlt: "Interior de una boutique con un cliente recibiendo una bolsa de papel",
    pdfCard: {
      title: "Guía Retail",
      href: "/landing/pdf/guia-retail.pdf",
      miniSvg: "/landing/cloud/ticket.svg",
    },
  },
  {
    index: "03",
    vertical: "salon",
    chipLabel: "Salón",
    chipTone: "clay",
    iconSvg: "/landing/cloud/heart-check.svg",
    headline: "Recordatorios y recompensas que llenan tu agenda",
    ctaLabel: "Ver demo salón",
    ctaHref: "/wallet/demo",
    bgImage: "/landing/panels/salon.jpg",
    bgAlt: "Estilista atendiendo a un cliente frente al espejo",
    pdfCard: {
      title: "Guía Salón",
      href: "/landing/pdf/guia-salon.pdf",
      miniSvg: "/landing/cloud/heart-check.svg",
    },
  },
  {
    index: "04",
    vertical: "restaurante",
    chipLabel: "Restaurante",
    chipTone: "mist",
    iconSvg: "/landing/cloud/confetti-burst.svg",
    headline: "De comensal a cliente recurrente, sin descuentos que duelan",
    ctaLabel: "Ver demo restaurante",
    ctaHref: "/wallet/demo",
    bgImage: "/landing/panels/restaurante.jpg",
    bgAlt: "Mesa familiar bajo luz cálida en un restaurante",
    pdfCard: {
      title: "Guía Restaurante",
      href: "/landing/pdf/guia-restaurante.pdf",
      miniSvg: "/landing/cloud/confetti-burst.svg",
    },
  },
  {
    index: "05",
    vertical: "servicios",
    chipLabel: "Servicios",
    chipTone: "stone",
    iconSvg: "/landing/cloud/dashboard-tile.svg",
    headline: "Profesionales que recuerdan a cada cliente, sin spreadsheets",
    ctaLabel: "Ver demo servicios",
    ctaHref: "/wallet/demo",
    bgImage: "/landing/panels/servicios.jpg",
    bgAlt: "Escritorio con laptop, planta y taza de cerámica",
    pdfCard: {
      title: "Guía Servicios",
      href: "/landing/pdf/guia-servicios.pdf",
      miniSvg: "/landing/cloud/dashboard-tile.svg",
    },
  },
];
