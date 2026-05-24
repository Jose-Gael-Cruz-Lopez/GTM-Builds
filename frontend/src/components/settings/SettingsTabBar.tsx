import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

export type SettingsTab = 'general' | 'loyalty' | 'staff' | 'account'

const TABS: Array<{ id: SettingsTab; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'loyalty', label: 'Programa de lealtad' },
  { id: 'staff', label: 'Staff y dispositivos' },
  { id: 'account', label: 'Cuenta' },
]

interface SettingsTabBarProps {
  businessId: string
  activeTab: SettingsTab
}

export function SettingsTabBar({ businessId, activeTab }: SettingsTabBarProps) {
  return (
    <nav
      className="sticky top-16 z-30 -mx-4 border-b border-[color:var(--border)] bg-[rgba(249,246,239,0.92)] px-4 backdrop-blur-md sm:-mx-6 sm:px-6"
      aria-label="Secciones de configuración"
    >
      <div className="flex gap-1 overflow-x-auto pb-px">
        {TABS.map((tab) => (
          <Link
            key={tab.id}
            to="/settings/$businessId"
            params={{ businessId }}
            search={{ tab: tab.id }}
            className={cn(
              'shrink-0 border-b-2 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'border-[color:var(--color-signal)] text-[color:var(--color-ink)]'
                : 'border-transparent text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]',
            )}
            aria-current={activeTab === tab.id ? 'page' : undefined}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  )
}
