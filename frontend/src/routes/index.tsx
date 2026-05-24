import { createFileRoute, Link } from '@tanstack/react-router'
import { ArrowRight, Sparkles, Shield, Zap, BarChart3, MessageCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { useSession } from '@/hooks/use-session'
import { useOwnedBusiness } from '@/hooks/use-owned-business'

export const Route = createFileRoute('/')({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: 'NexoLeal · Convierte cada visita en una razón para volver' },
      {
        name: 'description',
        content:
          'Lealtad digital, validación por QR sin fraude y campañas con IA. Para barberías, veterinarias, cafeterías, gimnasios y más en Latinoamérica.',
      },
    ],
  }),
})

const businessTypes = [
  'Barberías', 'Veterinarias', 'Cafeterías', 'Gimnasios boutique', 'Estéticas',
  'Consultorios', 'Spas', 'Lavanderías', 'Pet shops', 'Florerías',
]

function LandingPage() {
  return (
    <AppShell variant="light">
      <Hero />
      <Marquee />
      <HowItWorks />
      <Benefits />
      <DemoBand />
      <Pricing />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </AppShell>
  )
}

function Hero() {
  const { user } = useSession()
  const { businessId } = useOwnedBusiness()

  return (
    <section className="relative overflow-hidden bg-[var(--color-bg-base)] text-[var(--color-cream)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(circle at 85% 15%, rgba(245, 232, 216, 0.18), transparent 40%), radial-gradient(circle at 10% 90%, rgba(245, 197, 24, 0.15), transparent 50%)',
        }}
        aria-hidden
      />
      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-20 md:grid-cols-2 md:py-32 md:px-8">
        <div>
          <p className="eyebrow text-[color:var(--color-cream)]/70">Hola — hagamos que tus clientes regresen.</p>
          <h1 className="display-xl mt-4 text-[color:var(--color-cream)]">
            Convierte cada visita en una razón para volver.
          </h1>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-[color:var(--color-cream)]/80 md:text-lg">
            NexoLeal digitaliza la lealtad de tu negocio: monedero sin fricción para tu cliente, QR antifraude para tu staff y un panel con IA que te dice cuándo y a quién enviar campañas.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            {user ? (
              <Link
                to={businessId ? '/dashboard/$businessId' : '/wallet'}
                params={businessId ? { businessId } : undefined}
                className="btn-signal inline-flex items-center gap-2"
              >
                {businessId ? 'Abrir mi panel' : 'Abrir mi cartera'} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/signup" className="btn-signal inline-flex items-center gap-2">
                  Crear cuenta gratis <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/join/$businessId"
                  params={{ businessId: 'demo' }}
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-[color:var(--color-cream)] hover:bg-white/5"
                >
                  Ver demo en vivo
                </Link>
              </>
            )}
          </div>
          <p className="mt-6 text-xs text-[color:var(--color-cream)]/50">
            Sin instalaciones · 3 minutos para empezar · Plan gratis para siempre
          </p>
        </div>

        {/* Phone mockup */}
        <div className="relative mx-auto w-full max-w-sm">
          <div className="phone-float relative aspect-[9/19] rounded-[2.5rem] border border-white/10 bg-[var(--color-bg-elevated)] p-3 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)]">
            <div className="surface-card flex h-full flex-col items-center justify-between p-6 text-[color:var(--color-ink)]">
              <div className="w-full">
                <p className="eyebrow">La Barbería Sur</p>
                <p className="font-display text-2xl">Hola, Jose</p>
              </div>
              <div className="my-4 grid w-full grid-cols-4 gap-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className={`stamp-cell ${i < 5 ? 'filled' : ''}`}>
                    {i < 5 ? <Sparkles className="h-3.5 w-3.5" /> : null}
                  </div>
                ))}
              </div>
              <div className="w-full text-center">
                <p className="text-xs text-[color:var(--color-ink-soft)]">3 sellos para tu</p>
                <p className="font-display text-lg">Corte gratis</p>
              </div>
              <button type="button" className="btn-signal mt-4 w-full text-sm" disabled>
                Mostrar QR para sellar
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes phone-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
        .phone-float { animation: phone-float 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .phone-float { animation: none; } }
      `}</style>
    </section>
  )
}

function Marquee() {
  return (
    <section className="overflow-hidden border-y border-[color:var(--color-border)] bg-[var(--color-cream)] py-6">
      <p className="eyebrow mb-4 text-center text-[color:var(--color-ink-soft)]">
        Diseñado para PYMES de servicio en Latinoamérica
      </p>
      <div className="relative flex overflow-hidden">
        <div className="marquee-track flex shrink-0 gap-8 px-4 font-display text-2xl text-[color:var(--color-ink)]/80 md:text-3xl">
          {[...businessTypes, ...businessTypes].map((t, i) => (
            <span key={i} className="flex items-center gap-8">
              {t}
              <span className="text-[color:var(--color-celebrate)]">·</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      n: '01',
      title: 'Tu cliente abre su cartera digital',
      desc: 'Sin descargar nada. Un enlace o un QR le crea su carta de lealtad.',
    },
    {
      n: '02',
      title: 'Genera un QR que vive 90 segundos',
      desc: 'Firmado con HMAC-SHA256. Imposible falsificar o reutilizar.',
    },
    {
      n: '03',
      title: 'Tú escaneas, sumas un sello, y el sistema aprende',
      desc: 'Cada visita alimenta tu panel y entrena tus campañas con IA.',
    },
  ]
  return (
    <section id="como-funciona" className="mx-auto max-w-7xl px-4 py-20 md:px-8">
      <p className="eyebrow text-center">Cómo funciona</p>
      <h2 className="display-lg mt-2 text-center">En tres pasos, sin instalaciones.</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {steps.map((s) => (
          <article key={s.n} className="surface-paper p-8">
            <span className="font-display text-5xl text-[color:var(--color-signal)]">{s.n}</span>
            <h3 className="mt-4 font-display text-xl">{s.title}</h3>
            <p className="mt-2 text-sm text-[color:var(--color-ink-soft)]">{s.desc}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Benefits() {
  const items = [
    { icon: Shield, title: 'Sin fraude', desc: 'QR firmados que viven 90s y se invalidan al primer uso.' },
    { icon: Zap, title: 'Sin instalaciones', desc: 'Funciona en el navegador del cliente y del staff.' },
    { icon: MessageCircle, title: 'Campañas con IA', desc: 'Genera mensajes de reactivación en segundos.' },
    { icon: BarChart3, title: 'Métricas en tiempo real', desc: 'Detecta clientes inactivos antes de que se vayan.' },
  ]
  return (
    <section id="beneficios" className="bg-[var(--color-cream)] py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <p className="eyebrow">Por qué NexoLeal</p>
        <h2 className="display-lg mt-2 max-w-2xl">Tu negocio aprende de cada visita.</h2>
        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {items.map((b) => (
            <article key={b.title} className="surface-paper group p-6 transition hover:-translate-y-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-ink)] text-[var(--color-signal)]">
                <b.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-display text-lg">{b.title}</h3>
              <p className="mt-1 text-sm text-[color:var(--color-ink-soft)]">{b.desc}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

function DemoBand() {
  return (
    <section className="bg-[var(--color-bg-base)] py-20 text-[color:var(--color-cream)]">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
        <p className="eyebrow text-[color:var(--color-cream)]/70">Ver para creer</p>
        <h2 className="display-lg mt-2">Prueba el monedero en 10 segundos.</h2>
        <p className="mt-4 text-[color:var(--color-cream)]/80">
          Abre la demo y vive la experiencia de un cliente real, sin registro.
        </p>
        <Link
          to="/join/$businessId"
          params={{ businessId: 'demo' }}
          className="btn-signal mt-8 inline-flex items-center gap-2"
        >
          Abrir demo <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function Pricing() {
  const plans = [
    {
      name: 'Free',
      tagline: 'Para empezar',
      price: '$0',
      features: ['Hasta 100 clientes activos', '1 dispositivo de staff', 'Métricas básicas', 'Sin IA'],
      cta: 'Empezar gratis',
      highlight: false,
      plan: 'free',
    },
    {
      name: 'Pro',
      tagline: 'Para crecer',
      price: '$299 MXN/mes',
      features: [
        'Clientes ilimitados',
        '10 dispositivos de staff',
        'Campañas con IA (NVIDIA NIM)',
        'Métricas avanzadas y retención',
      ],
      cta: 'Probar Pro',
      highlight: true,
      plan: 'pro',
    },
  ]
  return (
    <section id="precios" className="mx-auto max-w-5xl px-4 py-20 md:px-8">
      <p className="eyebrow text-center">Precios</p>
      <h2 className="display-lg mt-2 text-center">Empieza gratis. Crece cuando estés listo.</h2>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {plans.map((p) => (
          <article
            key={p.name}
            className={`relative rounded-[var(--radius-lg)] p-8 ${
              p.highlight
                ? 'bg-[var(--color-ink)] text-[var(--color-cream)] shadow-[var(--shadow-lifted)]'
                : 'surface-paper'
            }`}
          >
            {p.highlight && (
              <span className="absolute -top-3 right-6 inline-flex rounded-full bg-[var(--color-celebrate)] px-3 py-1 text-xs font-semibold text-white">
                Recomendado
              </span>
            )}
            <p className="eyebrow opacity-70">{p.tagline}</p>
            <h3 className="mt-2 font-display text-3xl">{p.name}</h3>
            <p className="mt-2 font-display text-4xl">{p.price}</p>
            <ul className="mt-6 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Sparkles className={`mt-0.5 h-4 w-4 ${p.highlight ? 'text-[var(--color-signal)]' : 'text-[var(--color-celebrate)]'}`} />
                  {f}
                </li>
              ))}
            </ul>
            <Link
              to="/signup"
              search={{ plan: p.plan } as never}
              className={`mt-8 block w-full rounded-full px-5 py-3 text-center text-sm font-semibold ${
                p.highlight ? 'bg-[var(--color-signal)] text-[var(--color-ink)]' : 'bg-[var(--color-ink)] text-[var(--color-cream)]'
              }`}
            >
              {p.cta}
            </Link>
          </article>
        ))}
      </div>
    </section>
  )
}

function Testimonials() {
  return (
    <section className="bg-[var(--color-cream)] py-20">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
        <p className="eyebrow">Historias reales</p>
        <h2 className="display-md mt-2">
          Pronto: historias de negocios que crecen con NexoLeal.
        </h2>
        <p className="mt-4 text-[color:var(--color-ink-soft)]">
          Estamos recopilando casos reales. ¿Quieres ser uno de los primeros? Escríbenos.
        </p>
      </div>
    </section>
  )
}

function FinalCTA() {
  return (
    <section className="bg-[var(--color-celebrate)] py-20 text-white">
      <div className="mx-auto max-w-3xl px-4 text-center md:px-8">
        <h2 className="display-lg font-display">Empieza gratis en 3 minutos.</h2>
        <p className="mt-4 text-white/80">
          Crea tu cuenta, configura tu programa de lealtad y comparte el enlace con tus clientes hoy mismo.
        </p>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-[var(--color-signal)] px-6 py-3 text-sm font-semibold text-[var(--color-ink)]"
        >
          Crear mi cuenta <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-[var(--color-bg-base)] py-12 text-sm text-[color:var(--color-cream)]/70">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-3 md:px-8">
        <div>
          <div className="flex items-center gap-2 font-display text-lg text-[color:var(--color-cream)]">
            <Sparkles className="h-4 w-4 text-[color:var(--color-signal)]" /> NexoLeal
          </div>
          <p className="mt-2 max-w-xs">
            La capa de lealtad digital para PYMES de servicio en Latinoamérica.
          </p>
        </div>
        <div>
          <p className="eyebrow text-[color:var(--color-cream)]/50">Producto</p>
          <ul className="mt-3 space-y-2">
            <li><a href="#como-funciona">Cómo funciona</a></li>
            <li><a href="#precios">Precios</a></li>
            <li><Link to="/join/$businessId" params={{ businessId: 'demo' }}>Demo</Link></li>
          </ul>
        </div>
        <div>
          <p className="eyebrow text-[color:var(--color-cream)]/50">Legal</p>
          <ul className="mt-3 space-y-2">
            <li><Link to="/terms">Términos</Link></li>
            <li><Link to="/privacy">Privacidad</Link></li>
            <li><a href="mailto:hola@nexoleal.com">Contacto</a></li>
          </ul>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-7xl px-4 text-xs text-[color:var(--color-cream)]/40 md:px-8">
        © {new Date().getFullYear()} NexoLeal · Hecho en México 🇲🇽
      </div>
    </footer>
  )
}
