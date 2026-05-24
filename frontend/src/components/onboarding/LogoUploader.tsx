import { useCallback, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getCroppedImageBlob } from "@/components/onboarding/logo-crop-utils";

const MAX_BYTES = 1024 * 1024;

interface LogoUploaderProps {
  businessId: string;
  value: string | null;
  onChange: (url: string | null) => void;
}

export function LogoUploader({ businessId, value, onChange }: LogoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [uploading, setUploading] = useState(false);

  const onCropComplete = useCallback((_: Area, pixels: Area) => {
    setCroppedArea(pixels);
  }, []);

  const handleFile = (file: File | null) => {
    if (!file) return;
    if (file.size > MAX_BYTES) {
      toast.error("El logo debe pesar menos de 1 MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida");
      return;
    }
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const closeCrop = () => {
    if (cropSrc) URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    setCroppedArea(null);
  };

  const uploadCropped = async () => {
    if (!cropSrc || !croppedArea) return;
    setUploading(true);
    try {
      const blob = await getCroppedImageBlob(cropSrc, croppedArea);
      if (blob.size > MAX_BYTES) {
        toast.error("La imagen recortada supera 1 MB. Prueba con menos zoom.");
        return;
      }
      const path = `${businessId}/${Date.now()}.png`;
      const { error } = await supabase.storage.from("business-logos").upload(path, blob, {
        contentType: "image/png",
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("business-logos").getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Logo subido");
      closeCrop();
    } catch (e) {
      console.error(e);
      toast.error("No pudimos subir el logo. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      <div className="flex items-center gap-4">
        {value ? (
          <img
            src={value}
            alt="Logo del negocio"
            className="h-20 w-20 rounded-xl border border-[var(--border)] object-cover"
          />
        ) : (
          <div className="grid h-20 w-20 place-items-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--surface-soft)] text-[color:var(--color-ink-soft)]">
            <ImagePlus className="h-6 w-6" />
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
          >
            {value ? "Cambiar logo" : "Subir logo"}
          </Button>
          {value ? (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X className="h-4 w-4" /> Quitar
            </Button>
          ) : null}
        </div>
      </div>
      <p className="text-xs text-[color:var(--color-ink-soft)]">
        PNG o JPG, máximo 1 MB. Se recorta en cuadrado.
      </p>

      <Dialog open={!!cropSrc} onOpenChange={(open) => !open && closeCrop()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recorta tu logo</DialogTitle>
            <DialogDescription>
              Ajusta el encuadre cuadrado para tu tarjeta de lealtad.
            </DialogDescription>
          </DialogHeader>
          <div className="relative h-64 overflow-hidden rounded-lg bg-[var(--bg-elevated)]">
            {cropSrc ? (
              <Cropper
                image={cropSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            ) : null}
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
            aria-label="Zoom"
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={closeCrop} disabled={uploading}>
              Cancelar
            </Button>
            <Button type="button" onClick={uploadCropped} disabled={uploading || !croppedArea}>
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Subiendo…
                </>
              ) : (
                "Usar este logo"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
