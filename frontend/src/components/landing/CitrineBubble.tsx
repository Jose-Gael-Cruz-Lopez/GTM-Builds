import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function CitrineBubble() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Te respondemos en menos de 24 horas");
    setMessage("");
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Abrir chat de soporte"
        className="citrine-pulse fixed bottom-6 left-6 z-50 inline-flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
        style={{
          width: "56px",
          height: "56px",
          borderRadius: "9999px",
          background: "var(--signal-citrine)",
          border: "1.5px solid var(--ink)",
          color: "var(--ink)",
          // @ts-expect-error css var
          "--tw-ring-color": "var(--ink)",
        }}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="9" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="15" cy="12" r="4.25" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle
              style={{
                fontFamily: "var(--font-display)",
                fontSize: "1.75rem",
                fontWeight: 500,
                letterSpacing: "-0.02em",
              }}
            >
              Hablemos
            </DialogTitle>
            <DialogDescription>
              Cuéntanos en qué te ayudamos. Te respondemos en menos de 24 horas.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Cuéntanos en qué te ayudamos…"
              rows={5}
              required
              aria-label="Tu mensaje"
            />
            <DialogFooter>
              <Button type="submit" disabled={!message.trim()}>
                Enviar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
