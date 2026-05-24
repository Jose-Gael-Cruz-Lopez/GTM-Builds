export type BusinessCategory = "barbershop" | "salon" | "vet" | "cafe" | "gym" | "other";

export const BUSINESS_CATEGORY_OPTIONS: Array<{ label: string; value: BusinessCategory }> = [
  { label: "Cafetería", value: "cafe" },
  { label: "Restaurante", value: "other" },
  { label: "Barbería", value: "barbershop" },
  { label: "Salón de belleza", value: "salon" },
  { label: "Tienda de mascotas", value: "vet" },
  { label: "Tienda minorista", value: "other" },
  { label: "Gimnasio", value: "gym" },
  { label: "Otro", value: "other" },
];

export function mapBusinessTypeLabel(category: BusinessCategory): string {
  const found = BUSINESS_CATEGORY_OPTIONS.find((o) => o.value === category);
  return found?.label ?? "Negocio";
}
