import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { isValidStaffKeyFormat } from "@/lib/staff-key-storage";
import { toast } from "sonner";

interface StaffKeySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValue?: string;
  onSave: (key: string) => Promise<void>;
  onClear?: () => Promise<void>;
}

export function StaffKeySheet({
  open,
  onOpenChange,
  initialValue = "",
  onSave,
  onClear,
}: StaffKeySheetProps) {
  const [value, setValue] = useState(initialValue);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValue(initialValue);
  }, [open, initialValue]);

  const handleSave = async () => {
    if (!isValidStaffKeyFormat(value)) {
      toast.error("Formato inválido. Debe ser <businessId>:<key>");
      return;
    }
    setSaving(true);
    try {
      await onSave(value.trim());
      onOpenChange(false);
      toast.success("Llave guardada en este dispositivo");
    } catch {
      toast.error("No se pudo guardar la llave");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-[var(--radius-lg)] border-white/10 bg-[color:var(--color-bg-elevated)] text-[color:var(--color-cream)]"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-[color:var(--color-cream)]">
            Llave de staff
          </SheetTitle>
          <SheetDescription className="text-[color:var(--color-cream)]/70">
            Se guarda solo en este dispositivo (IndexedDB). Pégala tal como te la entregó el dueño
            del negocio.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-4 space-y-2">
          <Label htmlFor="staffKeySheet" className="text-[color:var(--color-cream)]">
            Llave del staff
          </Label>
          <Input
            id="staffKeySheet"
            className="min-h-14 font-mono text-sm"
            placeholder="businessId:rawKey"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        <SheetFooter className="mt-6 gap-2 sm:flex-col">
          <Button
            type="button"
            className="min-h-14 w-full bg-[color:var(--color-scanner-warm)] text-[color:var(--color-bg-base)] hover:bg-[color:var(--color-scanner-warm)]/90"
            disabled={saving}
            onClick={handleSave}
          >
            Guardar llave
          </Button>
          {onClear && initialValue && (
            <Button
              type="button"
              variant="outline"
              className="min-h-14 w-full border-white/15 bg-transparent text-[color:var(--color-cream)] hover:bg-white/5"
              onClick={() => void onClear()}
            >
              Borrar llave de este dispositivo
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
