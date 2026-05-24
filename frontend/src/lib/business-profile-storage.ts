export interface BusinessProfileExtras {
  tagline?: string;
  logoUrl?: string;
  primaryColor?: string;
  address?: string;
  phone?: string;
}

const profileKey = (businessId: string) => `nexoleal:business-profile:${businessId}`;
const staffSuffixKey = (keyId: string) => `nexoleal:staff-key-suffix:${keyId}`;

export function loadBusinessProfileExtras(businessId: string): BusinessProfileExtras {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(profileKey(businessId));
    return raw ? (JSON.parse(raw) as BusinessProfileExtras) : {};
  } catch {
    return {};
  }
}

export function saveBusinessProfileExtras(businessId: string, extras: BusinessProfileExtras) {
  if (typeof window === "undefined") return;
  localStorage.setItem(profileKey(businessId), JSON.stringify(extras));
}

export function rememberStaffKeySuffix(keyId: string, rawKey: string) {
  if (typeof window === "undefined") return;
  const suffix = rawKey.slice(-4);
  localStorage.setItem(staffSuffixKey(keyId), suffix);
}

export function getStaffKeySuffix(keyId: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(staffSuffixKey(keyId));
}
