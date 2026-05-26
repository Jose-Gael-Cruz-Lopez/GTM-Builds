import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { IsoScene } from "@/components/ui/iso-scene";

interface CameraPermissionStateProps {
  onActivate: () => void | Promise<void>;
}

export function CameraPermissionState({ onActivate }: CameraPermissionStateProps) {
  return (
    <IsoScene
      className="mx-4 border-white/10 bg-[color:var(--color-bg-elevated)]"
      title="Necesitamos acceso a la cámara"
      description="Activa la cámara para escanear los códigos QR de tus clientes en el mostrador."
      action={
        <Button
          type="button"
          className="min-h-14 min-w-[200px] bg-[color:var(--color-scanner-warm)] px-8 text-[color:var(--color-bg-base)] hover:bg-[color:var(--color-scanner-warm)]/90"
          onClick={onActivate}
        >
          <Camera className="mr-2 h-5 w-5" aria-hidden />
          Activar cámara
        </Button>
      }
    >
      <ScannerSceneGlyph />
    </IsoScene>
  );
}

function ScannerSceneGlyph() {
  return (
    <svg width="140" height="108" viewBox="0 0 140 108" fill="none" aria-hidden>
      <rect x="20" y="28" width="100" height="64" rx="12" fill="#C8A89A" opacity="0.2" />
      <rect x="20" y="28" width="100" height="64" rx="12" stroke="#C8A89A" strokeWidth="2" />
      <rect
        x="48"
        y="44"
        width="44"
        height="44"
        rx="6"
        stroke="#F5C518"
        strokeWidth="2"
        strokeDasharray="6 4"
      />
      <circle cx="70" cy="66" r="6" fill="#F5C518" opacity="0.6" />
      <path d="M34 88 L70 72 L106 88" stroke="#C8A89A" strokeWidth="2" strokeLinecap="round" />
      <rect x="58" y="12" width="24" height="12" rx="4" fill="#C8A89A" opacity="0.35" />
    </svg>
  );
}
