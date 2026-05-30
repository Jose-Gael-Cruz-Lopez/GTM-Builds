import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { motionPresets } from "@/lib/theme";

interface ScanReticleProps {
  processing?: boolean;
  successZoom?: boolean;
  className?: string;
}

export function ScanReticle({ processing, successZoom, className }: ScanReticleProps) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 flex items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <motion.div
        className="relative aspect-square w-[92%]"
        animate={successZoom ? motionPresets.scanZoom.animate : undefined}
        transition={successZoom ? motionPresets.scanZoom.transition : undefined}
      >
        {/* Sidewave radial pulse — idle only */}
        {!processing && !successZoom && (
          <motion.div
            className="absolute inset-0 rounded-[var(--radius-lg)] border border-[color:var(--color-scanner-warm)]/40"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0.15, 0.5] }}
            transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
          />
        )}

        {/* Corner brackets + frame */}
        <div
          className={cn(
            "absolute inset-0 rounded-[var(--radius-lg)] border-2 transition-colors duration-200",
            processing
              ? "border-[color:var(--color-signal)]"
              : "border-[color:var(--color-scanner-warm)]",
          )}
        />

        <ReticleCorner className="left-0 top-0 border-l-2 border-t-2" />
        <ReticleCorner className="right-0 top-0 border-r-2 border-t-2" />
        <ReticleCorner className="bottom-0 left-0 border-b-2 border-l-2" />
        <ReticleCorner className="bottom-0 right-0 border-b-2 border-r-2" />
      </motion.div>
    </div>
  );
}

function ReticleCorner({ className }: { className: string }) {
  return (
    <span
      className={cn(
        "absolute h-8 w-8 rounded-sm border-[color:var(--color-scanner-warm)]",
        className,
      )}
    />
  );
}
