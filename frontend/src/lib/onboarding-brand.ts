import { businessesApi } from '@/lib/api/businesses'
import { ApiError } from '@/lib/api-client'
import { tokens } from '@/lib/theme'

export interface BrandSettings {
  logoUrl: string | null
  primaryColor: string
  tagline: string
}

const storageKey = (businessId: string) => `nexoleal:brand:${businessId}`

export function loadBrandSettings(businessId: string): BrandSettings {
  const defaults: BrandSettings = {
    logoUrl: null,
    primaryColor: tokens.color.signal,
    tagline: '',
  }
  if (typeof window === 'undefined') return defaults
  try {
    const raw = localStorage.getItem(storageKey(businessId))
    if (!raw) return defaults
    const parsed = JSON.parse(raw) as Partial<BrandSettings>
    return {
      logoUrl: parsed.logoUrl ?? null,
      primaryColor: parsed.primaryColor ?? defaults.primaryColor,
      tagline: parsed.tagline ?? '',
    }
  } catch {
    return defaults
  }
}

export function saveBrandSettingsLocal(businessId: string, brand: BrandSettings) {
  try {
    localStorage.setItem(storageKey(businessId), JSON.stringify(brand))
  } catch {
    // private mode
  }
}

export async function persistBrandSettings(
  businessId: string,
  brand: BrandSettings,
): Promise<{ savedRemote: boolean }> {
  saveBrandSettingsLocal(businessId, brand)

  const patch = {
    logo_url: brand.logoUrl ?? undefined,
    primary_color: brand.primaryColor,
    tagline: brand.tagline || undefined,
  }

  try {
    await businessesApi.update(businessId, patch)
    return { savedRemote: true }
  } catch (e) {
    if (e instanceof ApiError && (e.status === 400 || e.status === 422)) {
      return { savedRemote: false }
    }
    throw e
  }
}

export const STAFF_KEY_STORAGE = (businessId: string) =>
  `nexoleal:onboarding-staff-key:${businessId}`
