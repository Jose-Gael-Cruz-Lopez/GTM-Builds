import { useState } from "react";
import { Copy, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { businessesApi } from "@/lib/api/businesses";
import { rememberStaffKeySuffix } from "@/lib/business-profile-storage";
import { ApiError } from "@/lib/api-client";

interface CreateStaffKeyDialogProps {
  businessId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

export function CreateStaffKeyDialog({
  businessId,
  open,
  onOpenChange,
  onCreated,
}: CreateStaffKeyDialogProps) {
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdKey, setCreatedKey] = useState<{
    rawKey: string;
    headerValue: string;
    id: string;
  } | null>(null);

  const reset = () => {
    setLabel("");
    setCreatedKey(null);
    setLoading(false);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const create = async () => {
    if (!label.trim()) {
      toast.error("Escribe una etiqueta para la clave");
      return;
    }
    setLoading(true);
    try {
      const res = await businessesApi.createStaffKey(businessId, { label: label.trim() });
      rememberStaffKeySuffix(res.id, res.rawKey);
      setCreatedKey({ rawKey: res.rawKey, headerValue: res.headerValue, id: res.id });
      onCreated();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "No pudimos crear la clave");
    } finally {
      setLoading(false);
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copiado al portapapeles");
    } catch {
      toast.error("No pudimos copiar");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        {!createdKey ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">Crear nueva clave</DialogTitle>
              <DialogDescription>
                Asigna un nombre al dispositivo — por ejemplo, &quot;Mostrador iPad&quot;.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="staff-key-label">Etiqueta del dispositivo</Label>
              <Input
                id="staff-key-label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Mostrador principal"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button onClick={create} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generar clave"}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">Clave creada</DialogTitle>
              <DialogDescription className="flex items-start gap-2 text-[color:var(--color-status-warn)]">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                Guárdala ahora. No la mostraremos otra vez.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs text-[color:var(--color-ink-soft)]">Clave (raw)</Label>
                <div className="mt-1 flex gap-2">
                  <code className="flex-1 overflow-x-auto rounded-lg bg-[color:var(--color-bg-base)] px-3 py-2 font-mono text-xs text-[color:var(--color-cream)]">
                    {createdKey.rawKey}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copy(createdKey.rawKey)}
                    aria-label="Copiar clave"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-[color:var(--color-ink-soft)]">
                  Header X-Staff-Key
                </Label>
                <div className="mt-1 flex gap-2">
                  <code className="flex-1 overflow-x-auto rounded-lg border px-3 py-2 font-mono text-xs">
                    {createdKey.headerValue}
                  </code>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => copy(createdKey.headerValue)}
                    aria-label="Copiar header"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => handleOpenChange(false)}>Entendido, la guardé</Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
