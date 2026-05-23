import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Benefits } from "@/components/landing/Benefits";
import { Testimonials } from "@/components/landing/Testimonials";
import { FinalCTA } from "@/components/landing/FinalCTA";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      {
        title:
          "NexoLeal · Programa de lealtad digital para PYMES sin tarjetas",
      },
      {
        name: "description",
        content:
          "Convierte visitas casuales en clientes frecuentes. NexoLeal es el programa de lealtad 100% digital para PYMES: sin tarjetas de cartón, sin hardware. Crea tu cuenta gratis.",
      },
      { property: "og:title", content: "NexoLeal · Lealtad digital para PYMES" },
      {
        property: "og:description",
        content:
          "Convierte visitas casuales en clientes frecuentes sin tarjetas de cartón. Programa de fidelización digital para cafés, barberías y tiendas.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "NexoLeal",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          description:
            "Programa de lealtad digital para PYMES. Convierte visitas casuales en clientes frecuentes sin tarjetas de cartón.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }),
      },
    ],
  }),
});

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <HowItWorks />
        <Benefits />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
