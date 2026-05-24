import { RouteError } from "@/components/RouteError"
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'

export const Route = createFileRoute('/terms')({
  component: Terms,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: 'Términos · NexoLeal' }] }),
})

function Terms() {
  return (
    <AppShell variant="light">
      <article className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <p className="eyebrow">Legal</p>
        <h1 className="display-lg mt-2">Términos de servicio</h1>
        <p className="mt-4 text-[color:var(--color-ink-soft)]">Última actualización: 23 de mayo de 2026.</p>
        <div className="prose mt-8 max-w-none text-[color:var(--color-ink)]">
          <p>
            NexoLeal es una plataforma para que pequeñas y medianas empresas administren programas de lealtad digital. Al usar el servicio, aceptas estos términos.
          </p>
          <h2 className="mt-8 font-display text-xl">1. Uso del servicio</h2>
          <p>El servicio se proporciona "tal cual" durante el periodo MVP. Nos reservamos el derecho de actualizar funciones, precios y disponibilidad.</p>
          <h2 className="mt-8 font-display text-xl">2. Datos y privacidad</h2>
          <p>Consulta nuestra política de privacidad para conocer cómo manejamos los datos de tu negocio y tus clientes.</p>
          <h2 className="mt-8 font-display text-xl">3. Contacto</h2>
          <p>Cualquier duda: hola@nexoleal.com.</p>
        </div>
      </article>
    </AppShell>
  )
}
