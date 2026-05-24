import { RouteError } from "@/components/RouteError"
import { createFileRoute } from '@tanstack/react-router'
import { AppShell } from '@/components/layout/AppShell'

export const Route = createFileRoute('/privacy')({
  component: Privacy,
  errorComponent: RouteError,
  head: () => ({ meta: [{ title: 'Privacidad · NexoLeal' }] }),
})

function Privacy() {
  return (
    <AppShell variant="light">
      <article className="mx-auto max-w-3xl px-4 py-16 md:px-8">
        <p className="eyebrow">Legal</p>
        <h1 className="display-lg mt-2">Política de privacidad</h1>
        <p className="mt-4 text-[color:var(--color-ink-soft)]">Última actualización: 23 de mayo de 2026.</p>
        <div className="prose mt-8 max-w-none text-[color:var(--color-ink)]">
          <p>
            En NexoLeal recolectamos solo los datos necesarios para operar tu programa de lealtad: nombre del negocio, contacto del dueño, y datos básicos de tus clientes para identificar visitas y recompensas.
          </p>
          <h2 className="mt-8 font-display text-xl">1. Datos que recolectamos</h2>
          <ul className="ml-6 list-disc">
            <li>Información de cuenta (email, contraseña hasheada).</li>
            <li>Información del negocio (nombre, categoría, configuración de lealtad).</li>
            <li>Información de clientes (nombre, sellos acumulados, fechas de visita).</li>
          </ul>
          <h2 className="mt-8 font-display text-xl">2. Cómo usamos los datos</h2>
          <p>Para operar el servicio, generar campañas con IA y mostrar métricas a los dueños de negocio.</p>
          <h2 className="mt-8 font-display text-xl">3. Tus derechos</h2>
          <p>Puedes solicitar eliminar tu cuenta en cualquier momento desde Configuración.</p>
        </div>
      </article>
    </AppShell>
  )
}
