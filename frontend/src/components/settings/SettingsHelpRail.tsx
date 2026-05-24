import { HelpCircle, Heart, KeyRound, Shield } from 'lucide-react'
import type { SettingsTab } from './SettingsTabBar'

const HELP: Record<
  SettingsTab,
  { title: string; body: string; icon: typeof HelpCircle }
> = {
  general: {
    icon: HelpCircle,
    title: 'Datos de tu negocio',
    body: 'Esta información aparece en la tarjeta de lealtad y en el escáner del staff. Mantén el nombre y la categoría actualizados para que tus clientes te reconozcan.',
  },
  loyalty: {
    icon: Heart,
    title: 'Reglas del programa',
    body: 'El número de sellos define cuántas visitas necesita un cliente para la recompensa. Los clientes que ya están en curso conservan su progreso actual.',
  },
  staff: {
    icon: KeyRound,
    title: 'Claves de dispositivo',
    body: 'Cada tablet o teléfono del mostrador necesita su propia clave. Revoca las claves que ya no uses — por ejemplo, si un empleado deja el negocio.',
  },
  account: {
    icon: Shield,
    title: 'Tu cuenta de propietario',
    body: 'Cambiar el email requiere confirmación por correo. Cerrar sesión en todos los dispositivos te protege si perdiste acceso a uno de ellos.',
  },
}

interface SettingsHelpRailProps {
  tab: SettingsTab
}

export function SettingsHelpRail({ tab }: SettingsHelpRailProps) {
  const { icon: Icon, title, body } = HELP[tab]

  return (
    <aside className="hidden lg:block">
      <div className="surface-paper sticky top-36 p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--color-health)]/20">
          <Icon className="h-5 w-5 text-[color:var(--color-ink)]" aria-hidden />
        </div>
        <h2 className="font-display text-base font-semibold">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-[color:var(--color-ink-soft)]">{body}</p>
      </div>
    </aside>
  )
}
