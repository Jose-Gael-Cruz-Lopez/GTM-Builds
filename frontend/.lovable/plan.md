# Landing Page B2B — NexoLeal

Software de lealtad digital para PYMES. Estilo SaaS limpio, paleta Azul Índigo + Verde Menta.

## Estructura (una sola ruta `/`)

Reemplazo el placeholder en `src/routes/index.tsx` y construyo la landing como secciones componibles dentro de `src/components/landing/`.

1. **Navbar** — Logo "NexoLeal", links ancla (Cómo funciona, Testimonios, Precios), botón CTA secundario "Iniciar sesión" y primario "Crear cuenta".
2. **Hero**
  - H1: *"Convierte visitas casuales en clientes frecuentes sin tarjetas de cartón"*
  - Subtítulo enfocado a PYMES (café, barbería, retail) sobre lealtad 100% digital vía QR/teléfono.
  - CTA primario "Crear cuenta de mi negocio" + CTA secundario "Ver demo".
  - Mockup visual: tarjeta de fidelidad digital en mobile + dashboard PYME (composición con divs/Tailwind, sin imágenes pesadas; ilustración generada si suma valor).
3. **Logos / prueba social ligera** — fila de "Usado por +500 negocios locales" con tipos de comercio (texto, no logos falsos).
4. **Cómo funciona (3 pasos)**
  - Paso 1 — Registra tu negocio en 2 minutos.
  - Paso 2 — Tus clientes acumulan sellos escaneando un QR.
  - Paso 3 — Premia y reactiva con campañas automáticas.
  - Layout: 3 cards con número grande, icono Lucide, título, descripción.
5. **Beneficios clave** — grid 2x2 corto (Sin hardware, Datos de tus clientes, Campañas automáticas, Reportes en tiempo real).
6. **Testimonios (2)**
  - Barbería "Estudio Navaja" — dueño habla de recompra semanal.
  - Tienda de mascotas "PataFeliz" — dueña habla de aumento de ticket promedio.
  - Cards con avatar (iniciales en círculo con gradiente), quote, nombre, negocio, ciudad.
7. **CTA final grande** — Banner full-width con gradiente índigo→menta, headline "Empieza gratis hoy", botón XL **"Crear cuenta de mi negocio"**, microcopy "Sin tarjeta de crédito · Configuración en 5 min".
8. **Footer** — Links básicos, copyright, idioma ES.

## Sistema de diseño

Actualizo `src/styles.css` con tokens semánticos (oklch):

- `--primary` Azul Índigo (~oklch(0.45 0.18 270))
- `--accent` Verde Menta (~oklch(0.85 0.13 165))
- Gradientes: `--gradient-hero` índigo→menta, `--gradient-soft` menta translúcido para fondos de sección.
- Sombras suaves SaaS, radius 0.75rem, tipografía: Inter (body) + Space Grotesk (headings) vía `<link>` en `head()` de la ruta.

Todo se consume con clases Tailwind semánticas (`bg-primary`, `text-accent-foreground`, etc.). Nada de colores hardcoded en componentes.

## SEO

En `Route.head()`: title <60 chars, meta description en español, og:title/description, viewport ya está en root. Un solo H1 (el del Hero). Alt text en cualquier imagen. JSON-LD `SoftwareApplication`.

## Archivos a crear/modificar

- `src/styles.css` — añadir tokens índigo/menta + gradientes + fuentes.
- `src/routes/index.tsx` — head SEO + ensamblar secciones.
- `src/components/landing/Navbar.tsx`
- `src/components/landing/Hero.tsx`
- `src/components/landing/HowItWorks.tsx`
- `src/components/landing/Benefits.tsx`
- `src/components/landing/Testimonials.tsx`
- `src/components/landing/FinalCTA.tsx`
- `src/components/landing/Footer.tsx`

Backend: con conexión a Supabase 

## Notas técnicas

- Stack: TanStack Start + Tailwind v4 + shadcn `Button`/`Card` ya disponibles.
- Animaciones ligeras con clases utilitarias (`transition`, `hover:` translate/scale). Sin framer-motion para mantener simple, salvo que lo pidas.
- Todo el copy en español.