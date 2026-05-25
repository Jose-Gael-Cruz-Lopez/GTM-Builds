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
 * Cloud items deliberately leave a ~60vw x 30vh negative-space clearance
 * centered around the hero headline (roughly top 35-65%, left 20-80%).
 * Items concentrate at the corners and along the top/bottom thirds.
 */
export const cloudItems: CloudItem[] = [
  {
    id: "loyalty-card",
    src: "/landing/cloud/loyalty-card.svg",
    alt: "Tarjeta de lealtad NexoLeal",
    w: 120,
    h: 76,
    top: "20%",
    left: "12%",
    scale: 1.0,
    rot: -4,
    driftSeconds: 11,
    driftDelay: 0,
    dx: 12,
    dy: -10,
    parallax: 0.6,
  },
  {
    id: "stamp-cluster",
    src: "/landing/cloud/stamp-cluster.svg",
    alt: "Sellos acumulados",
    w: 90,
    h: 80,
    top: "78%",
    left: "18%",
    scale: 0.9,
    rot: 6,
    driftSeconds: 13,
    driftDelay: 1.2,
    dx: -10,
    dy: -14,
    parallax: 0.4,
  },
  {
    id: "qr-code",
    src: "/landing/cloud/qr-code.svg",
    alt: "Código QR",
    w: 80,
    h: 80,
    top: "16%",
    left: "78%",
    scale: 0.95,
    rot: 3,
    driftSeconds: 12,
    driftDelay: 2.4,
    dx: 8,
    dy: 10,
    parallax: 0.5,
  },
  {
    id: "whatsapp-bubble",
    src: "/landing/cloud/whatsapp-bubble.svg",
    alt: "Mensaje de WhatsApp",
    w: 90,
    h: 78,
    top: "70%",
    left: "82%",
    scale: 0.85,
    rot: -5,
    driftSeconds: 10,
    driftDelay: 0.8,
    dx: -8,
    dy: -12,
    parallax: 0.55,
  },
  {
    id: "phone-wallet",
    src: "/landing/cloud/phone-wallet.svg",
    alt: "Teléfono con monedero",
    w: 60,
    h: 100,
    top: "12%",
    left: "46%",
    scale: 0.85,
    rot: -7,
    driftSeconds: 14,
    driftDelay: 1.6,
    dx: 6,
    dy: 8,
    parallax: 0.7,
  },
  {
    id: "dashboard-tile",
    src: "/landing/cloud/dashboard-tile.svg",
    alt: "Mosaico de retención",
    w: 110,
    h: 70,
    top: "91%",
    left: "56%",
    scale: 0.95,
    rot: 4,
    driftSeconds: 12,
    driftDelay: 0.4,
    dx: 10,
    dy: 6,
    parallax: 0.45,
  },
  {
    id: "segment-ring",
    src: "/landing/cloud/segment-ring.svg",
    alt: "Anillo de segmentos",
    w: 80,
    h: 80,
    top: "30%",
    left: "88%",
    scale: 0.8,
    rot: -2,
    driftSeconds: 13,
    driftDelay: 2.1,
    dx: -6,
    dy: 12,
    parallax: 0.5,
  },
  {
    id: "retention-arc",
    src: "/landing/cloud/retention-arc.svg",
    alt: "Curva de retención",
    w: 130,
    h: 70,
    top: "26%",
    left: "6%",
    scale: 0.9,
    rot: 5,
    driftSeconds: 11,
    driftDelay: 3.0,
    dx: 14,
    dy: 8,
    parallax: 0.5,
  },
  {
    id: "peso-coin",
    src: "/landing/cloud/peso-coin.svg",
    alt: "Moneda de peso",
    w: 70,
    h: 70,
    top: "72%",
    left: "8%",
    scale: 0.85,
    rot: -8,
    driftSeconds: 9,
    driftDelay: 0.2,
    dx: -10,
    dy: 10,
    parallax: 0.65,
  },
  {
    id: "ticket",
    src: "/landing/cloud/ticket.svg",
    alt: "Recibo",
    w: 70,
    h: 110,
    top: "60%",
    left: "90%",
    scale: 0.8,
    rot: 7,
    driftSeconds: 12,
    driftDelay: 1.0,
    dx: 6,
    dy: -10,
    parallax: 0.55,
  },
  {
    id: "heart-check",
    src: "/landing/cloud/heart-check.svg",
    alt: "Cliente fidelizado",
    w: 80,
    h: 76,
    top: "8%",
    left: "30%",
    scale: 0.8,
    rot: 4,
    driftSeconds: 10,
    driftDelay: 1.8,
    dx: -8,
    dy: 8,
    parallax: 0.5,
  },
  {
    id: "confetti-burst",
    src: "/landing/cloud/confetti-burst.svg",
    alt: "Celebración de recompensa",
    w: 90,
    h: 90,
    top: "88%",
    left: "70%",
    scale: 0.75,
    rot: 0,
    driftSeconds: 11,
    driftDelay: 0.6,
    dx: 8,
    dy: -6,
    parallax: 0.4,
  },
];

// ============================================================
// Use case panels (scroll stack)
// ============================================================

import type { Dictionary } from "@/lib/i18n";

export type UseCasePanel = {
  index: string;
  vertical: "cafeteria" | "retail" | "restaurante";
  chipLabel: string;
  chipTone: "coral" | "sage" | "clay" | "mist" | "stone";
  iconSvg: string;
  headline: string;
  ctaLabel: string;
  ctaHref: string;
  bgImage: string;
  bgAlt: string;
};

export function getUseCasePanels(d: Dictionary): UseCasePanel[] {
  return [
    {
      index: "01",
      vertical: "cafeteria",
      chipLabel: d.landing.panels.cafeteria.chipLabel,
      chipTone: "coral",
      iconSvg: "/landing/cloud/stamp-cluster.svg",
      headline: d.landing.panels.cafeteria.headline,
      ctaLabel: d.landing.panels.cafeteria.ctaLabel,
      ctaHref: "/signup",
      bgImage: "/landing/panels/cafeteria.jpg",
      bgAlt: "Barista preparando café en una cafetería de barrio",
    },
    {
      index: "02",
      vertical: "retail",
      chipLabel: d.landing.panels.retail.chipLabel,
      chipTone: "sage",
      iconSvg: "/landing/cloud/ticket.svg",
      headline: d.landing.panels.retail.headline,
      ctaLabel: d.landing.panels.retail.ctaLabel,
      ctaHref: "/signup",
      bgImage: "/landing/panels/retail.jpg",
      bgAlt: "Interior de una boutique con un cliente recibiendo una bolsa de papel",
    },
    {
      index: "03",
      vertical: "restaurante",
      chipLabel: d.landing.panels.restaurante.chipLabel,
      chipTone: "mist",
      iconSvg: "/landing/cloud/confetti-burst.svg",
      headline: d.landing.panels.restaurante.headline,
      ctaLabel: d.landing.panels.restaurante.ctaLabel,
      ctaHref: "/signup",
      bgImage: "/landing/panels/restaurante.jpg",
      bgAlt: "Mesa familiar bajo luz cálida en un restaurante",
    },
  ];
}
