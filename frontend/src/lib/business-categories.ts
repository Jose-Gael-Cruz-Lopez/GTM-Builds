export type BusinessCategory = "barbershop" | "salon" | "vet" | "cafe" | "gym" | "other";

type UiCategory = BusinessCategory | "restaurant" | "retail";

export const BUSINESS_CATEGORY_OPTIONS: Array<{ label: string; value: UiCategory }> = [
  { label: "Cafetería", value: "cafe" },
  { label: "Restaurante", value: "restaurant" },
  { label: "Barbería", value: "barbershop" },
  { label: "Salón de belleza", value: "salon" },
  { label: "Tienda de mascotas", value: "vet" },
  { label: "Tienda minorista", value: "retail" },
  { label: "Gimnasio", value: "gym" },
  { label: "Otro", value: "other" },
];

const UI_TO_DB: Record<UiCategory, BusinessCategory> = {
  cafe: "cafe",
  restaurant: "other",
  barbershop: "barbershop",
  salon: "salon",
  vet: "vet",
  retail: "other",
  gym: "gym",
  other: "other",
};

export function uiCategoryToDb(value: string): BusinessCategory {
  return UI_TO_DB[value as UiCategory] ?? "other";
}

export function mapBusinessTypeLabel(category: string): string {
  const found = BUSINESS_CATEGORY_OPTIONS.find((o) => o.value === category);
  return found?.label ?? "Negocio";
}
