import { RouteError } from "@/components/RouteError";
import { createFileRoute } from "@tanstack/react-router";
import { routeMeta } from "@/lib/route-meta";
import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Html5Qrcode } from "html5-qrcode";
import { toast } from "sonner";
import { z } from "zod";
import { visitsApi, type RegisterVisitResponse } from "@/lib/api/visits";
import { ApiError } from "@/lib/api-client";
import {
  getStaffKey,
  setStaffKey,
  clearStaffKey,
  parseBusinessIdFromKey,
} from "@/lib/staff-key-storage";
import { enqueueScan, listQueuedScans, replayQueuedScans } from "@/lib/scan-offline-queue";
import { supabase } from "@/integrations/supabase/client";
import { ScanTopBar } from "@/components/scan/ScanTopBar";
import { ScanReticle } from "@/components/scan/ScanReticle";
import { ScanStatusPanel, type ScanStatus } from "@/components/scan/ScanStatusPanel";
import { StaffKeySheet } from "@/components/scan/StaffKeySheet";
import { CameraPermissionState } from "@/components/scan/CameraPermissionState";
import { refreshDashboardStats } from "@/lib/dashboard-query-keys";
import { businessesApi } from "@/lib/api/businesses";

const searchSchema = z.object({
  bid: z.string().optional(),
});

export const Route = createFileRoute("/scan")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ScanPage,
  errorComponent: RouteError,
  head: () =>
    routeMeta(
      "Escáner de visitas · NexoLeal",
      "Escanea códigos QR de clientes en caja y registra visitas al instante.",
    ),
});

const CONTAINER_ID = "scanner-container";
const SIMULATE_MODES = ["success", "expired", "used", "invalid-key", "reward"] as const;
type SimulateMode = (typeof SIMULATE_MODES)[number];

function hapticSuccess() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate(50);
  }
}

function hapticError() {
  if (typeof navigator !== "undefined" && navigator.vibrate) {
    navigator.vibrate([80, 40, 80]);
  }
}

function firstName(fullName: string): string {
  return fullName.trim().split(/\s+/)[0] || "Cliente";
}

async function resolveBusinessName(businessId: string): Promise<string> {
  const cacheKey = `nexoleal:business-name:${businessId}`;
  const cached = localStorage.getItem(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .maybeSingle();
    if (data?.name) {
      localStorage.setItem(cacheKey, data.name);
      return data.name;
    }
  } catch {
    /* best-effort */
  }
  return "Tu negocio";
}

async function checkIsOwner(businessId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .maybeSingle();
  return !!data;
}

function ScanPage() {
  const qc = useQueryClient();
  const { bid: ownerBid } = Route.useSearch();
  const [keyReady, setKeyReady] = useState(false);
  const [keyLoading, setKeyLoading] = useState(true);
  const [storedKey, setStoredKey] = useState("");
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("Tu negocio");
  const [isOwner, setIsOwner] = useState(false);
  const [status, setStatus] = useState<ScanStatus>({ kind: "idle" });
  const [cameraDenied, setCameraDenied] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [successZoom, setSuccessZoom] = useState(false);
  const [keySheetOpen, setKeySheetOpen] = useState(false);
  const [queuedCount, setQueuedCount] = useState(0);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const processingRef = useRef(false);
  const lastTokenRef = useRef<string>("");
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const simulate = getSimulateMode();

  const scheduleClear = useCallback((ms: number, next: ScanStatus = { kind: "idle" }) => {
    if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
    clearTimerRef.current = setTimeout(() => {
      setStatus(next);
      setSuccessZoom(false);
    }, ms);
  }, []);

  const bumpDashboardStats = useCallback(
    (bid: string, res: RegisterVisitResponse) => {
      if (res.alreadyRegistered) return;
      refreshDashboardStats(qc, bid, res.stats);
    },
    [qc],
  );

  const applySuccess = useCallback(
    (res: RegisterVisitResponse, bid: string | null) => {
      if (bid) bumpDashboardStats(bid, res);

      const visit = res.visit as { clientName?: string };
      const clientFirstName = firstName(visit.clientName ?? "Cliente");
      const stampsRemaining = res.stamps?.remaining ?? 0;

      if (res.rewardUnlocked && res.reward?.description) {
        setStatus({
          kind: "success-reward",
          rewardDescription: res.reward.description,
        });
        hapticSuccess();
        scheduleClear(6000);
        return;
      }

      setSuccessZoom(true);
      setStatus({
        kind: "success-stamp",
        clientFirstName,
        stampsRemaining,
      });
      hapticSuccess();
      scheduleClear(3000);
    },
    [bumpDashboardStats, scheduleClear],
  );

  const applyError = useCallback(
    (code: string, message?: string) => {
      hapticError();

      if (code === "TOKEN_EXPIRED" || code === "token_expired") {
        setStatus({ kind: "error-expired" });
        scheduleClear(3500);
        return;
      }
      if (code === "TOKEN_ALREADY_USED" || code === "already_used" || code === "VISIT_DUPLICATE") {
        setStatus({ kind: "error-used" });
        scheduleClear(3500);
        return;
      }
      if (code === "AUTH_INVALID" || code === "invalid_staff_key" || code === "AUTH_MISSING") {
        setStatus({ kind: "error-invalid-key", message });
        setKeySheetOpen(true);
        scheduleClear(5000);
        return;
      }
      if (code === "CAMERA_ERROR") {
        setCameraDenied(true);
        setCameraActive(false);
        setStatus({ kind: "error-camera" });
        return;
      }

      setStatus({ kind: "error-used" });
      scheduleClear(3500);
    },
    [scheduleClear],
  );

  const processToken = useCallback(
    async (token: string) => {
      if (processingRef.current || token === lastTokenRef.current) return;
      processingRef.current = true;
      lastTokenRef.current = token;
      setStatus({ kind: "validating" });
      setSuccessZoom(false);

      const scanner = scannerRef.current;
      if (scanner?.isScanning) {
        scanner.pause(true);
      }

      try {
        if (!navigator.onLine) {
          await enqueueScan(token);
          const items = await listQueuedScans();
          setQueuedCount(items.length);
          setStatus({ kind: "offline-queued", count: items.length });
          hapticError();
          scheduleClear(3000);
          return;
        }

        const res = await visitsApi.register({ token });
        applySuccess(res, businessId);
      } catch (e) {
        if (e instanceof ApiError) {
          applyError(e.code, e.message);
        } else {
          applyError("UNKNOWN", e instanceof Error ? e.message : undefined);
        }
      } finally {
        processingRef.current = false;
        if (scanner?.isScanning) {
          scanner.resume();
        }
        setTimeout(() => {
          lastTokenRef.current = "";
        }, 2000);
      }
    },
    [applyError, applySuccess, businessId, scheduleClear],
  );

  const runSimulate = useCallback(
    (mode: SimulateMode) => {
      processingRef.current = true;
      setStatus({ kind: "validating" });
      setSuccessZoom(false);

      window.setTimeout(() => {
        processingRef.current = false;
        switch (mode) {
          case "success":
            setSuccessZoom(true);
            setStatus({
              kind: "success-stamp",
              clientFirstName: "María",
              stampsRemaining: 3,
            });
            hapticSuccess();
            scheduleClear(3000);
            break;
          case "reward":
            setStatus({
              kind: "success-reward",
              rewardDescription: "Café gratis",
            });
            hapticSuccess();
            scheduleClear(6000);
            break;
          case "expired":
            applyError("TOKEN_EXPIRED");
            break;
          case "used":
            applyError("TOKEN_ALREADY_USED");
            break;
          case "invalid-key":
            applyError("AUTH_INVALID", "Llave de staff inválida");
            break;
        }
      }, 450);
    },
    [applyError, scheduleClear],
  );

  // Load staff key from IndexedDB; auto-create one for owners coming from the dashboard
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const key = await getStaffKey();
      if (cancelled) return;
      if (key) {
        setStoredKey(key);
        setKeyReady(true);
        const bid = parseBusinessIdFromKey(key);
        setBusinessId(bid);
        if (bid) {
          const [name, owner] = await Promise.all([resolveBusinessName(bid), checkIsOwner(bid)]);
          if (!cancelled) {
            setBusinessName(name);
            setIsOwner(owner);
          }
        }
      } else if (ownerBid) {
        // Came from dashboard: verify ownership then auto-create a staff key
        const owner = await checkIsOwner(ownerBid);
        if (cancelled) return;
        if (owner) {
          try {
            const res = await businessesApi.createStaffKey(ownerBid, { label: "Dueño (auto)" });
            if (cancelled) return;
            await setStaffKey(res.headerValue);
            setStoredKey(res.headerValue);
            setKeyReady(true);
            setBusinessId(ownerBid);
            setIsOwner(true);
            const name = await resolveBusinessName(ownerBid);
            if (!cancelled) setBusinessName(name);
          } catch {
            if (!cancelled) {
              toast.error("No se pudo configurar el escáner automáticamente.");
              setKeySheetOpen(true);
            }
          }
        } else if (!cancelled) {
          setKeySheetOpen(true);
        }
      } else {
        setKeySheetOpen(true);
      }
      if (!cancelled) setKeyLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [ownerBid]);

  // Dev simulate query param
  useEffect(() => {
    if (!simulate || keyLoading) return;
    runSimulate(simulate);
  }, [simulate, keyLoading, runSimulate]);

  // Replay offline queue when back online
  useEffect(() => {
    const syncQueue = async () => {
      if (!navigator.onLine || !keyReady) return;
      const { processed } = await replayQueuedScans(async (token) => {
        const res = await visitsApi.register({ token });
        if (businessId && !res.alreadyRegistered) {
          refreshDashboardStats(qc, businessId, res.stats);
        }
        return res;
      });
      if (processed > 0) {
        toast.success(`${processed} visita(s) sincronizada(s)`);
        const items = await listQueuedScans();
        setQueuedCount(items.length);
      }
    };

    const onOnline = () => void syncQueue();
    window.addEventListener("online", onOnline);
    void syncQueue();
    return () => window.removeEventListener("online", onOnline);
  }, [businessId, keyReady, qc]);

  // Camera scanner lifecycle
  useEffect(() => {
    if (!keyReady || cameraDenied || !cameraActive || simulate) return;

    // Guard: element must exist before Html5Qrcode constructor is called
    const container = document.getElementById(CONTAINER_ID);
    if (!container) return;

    let cancelled = false;
    let scanner: Html5Qrcode;

    try {
      scanner = new Html5Qrcode(CONTAINER_ID);
    } catch {
      if (!cancelled) {
        setCameraDenied(true);
        setCameraActive(false);
        setStatus({ kind: "error-camera" });
      }
      return;
    }

    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 12, qrbox: { width: 260, height: 260 } },
        (decoded) => {
          if (cancelled || processingRef.current) return;
          void processToken(decoded);
        },
        () => {
          /* per-frame miss */
        },
      )
      .catch(() => {
        if (!cancelled) {
          setCameraDenied(true);
          setCameraActive(false);
          setStatus({ kind: "error-camera" });
        }
      });

    return () => {
      cancelled = true;
      scanner
        .stop()
        .catch(() => {})
        .finally(() => {
          if (scannerRef.current === scanner) scannerRef.current = null;
        });
    };
  }, [keyReady, cameraDenied, cameraActive, simulate, processToken]);

  // Auto-start camera once key is ready and loading is done so the container div is in the DOM
  useEffect(() => {
    if (!keyReady || keyLoading || cameraDenied || simulate) return;

    let cancelled = false;

    const requestAndStart = async () => {
      // Ask for camera permission proactively so the browser shows the dialog
      if (navigator.mediaDevices?.getUserMedia) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: true });
          stream.getTracks().forEach((t) => t.stop());
        } catch {
          if (!cancelled) {
            setCameraDenied(true);
            setStatus({ kind: "error-camera" });
          }
          return;
        }
      }
      if (!cancelled) {
        setCameraActive(true);
        setStatus({ kind: "idle" });
      }
    };

    void requestAndStart();
    return () => {
      cancelled = true;
    };
  }, [keyReady, keyLoading, cameraDenied, simulate]);

  useEffect(() => {
    return () => {
      if (clearTimerRef.current) clearTimeout(clearTimerRef.current);
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, []);

  const handleSaveKey = async (key: string) => {
    await setStaffKey(key);
    setStoredKey(key);
    setKeyReady(true);
    const bid = parseBusinessIdFromKey(key);
    setBusinessId(bid);
    if (bid) {
      const [name, owner] = await Promise.all([resolveBusinessName(bid), checkIsOwner(bid)]);
      setBusinessName(name);
      setIsOwner(owner);
    }
    // Don't set cameraActive directly — let the auto-start effect handle permission request
    setCameraDenied(false);
    setStatus({ kind: "idle" });
  };

  const handleClearKey = async () => {
    await clearStaffKey();
    setStoredKey("");
    setKeyReady(false);
    setBusinessId(null);
    setBusinessName("Tu negocio");
    setIsOwner(false);
    setCameraActive(false);
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setKeySheetOpen(true);
    setStatus({ kind: "idle" });
  };

  const settingsHref = isOwner && businessId ? `/settings/${businessId}` : undefined;
  const effectiveBid = ownerBid ?? businessId ?? null;
  const backHref = isOwner && effectiveBid ? `/dashboard/${effectiveBid}` : undefined;

  return (
    <div
      data-theme="dark"
      className="flex min-h-screen flex-col bg-[color:var(--color-bg-base)] text-[color:var(--color-cream)]"
    >
      <ScanTopBar
        businessName={businessName}
        settingsHref={settingsHref}
        onSettingsClick={() => setKeySheetOpen(true)}
        backHref={backHref}
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col">
        {keyLoading ? (
          <div className="flex flex-1 items-center justify-center px-4">
            <p className="text-sm text-[color:var(--color-scanner-warm)]">Cargando escáner...</p>
          </div>
        ) : cameraDenied ? (
          <div className="flex flex-1 flex-col justify-center py-6">
            <CameraPermissionState
              onActivate={async () => {
                try {
                  // Explicitly request permission — shows the browser dialog if still "prompt"
                  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
                  stream.getTracks().forEach((t) => t.stop());
                } catch {
                  // Permission denied by user or not supported; leave cameraDenied = true
                  return;
                }
                setCameraDenied(false);
                setCameraActive(true);
                setStatus({ kind: "idle" });
              }}
            />
          </div>
        ) : (
          <div className="relative mx-4 mt-2">
            <div id={CONTAINER_ID} className="relative w-full" />
            {(cameraActive || simulate) && (
              <ScanReticle processing={status.kind === "validating"} successZoom={successZoom} />
            )}
          </div>
        )}

        <ScanStatusPanel status={status} className="mt-auto" />

        {queuedCount > 0 && status.kind === "idle" && (
          <p className="mx-4 mb-4 text-center text-xs text-[color:var(--color-status-warn)]">
            {queuedCount} visita(s) pendiente(s) de sincronizar
          </p>
        )}

        {simulate && (
          <p className="mx-4 mb-4 text-center text-[10px] text-white/30">
            Modo simulación: {simulate}
          </p>
        )}
      </main>

      <StaffKeySheet
        open={keySheetOpen}
        onOpenChange={setKeySheetOpen}
        initialValue={storedKey}
        onSave={handleSaveKey}
        onClear={storedKey ? handleClearKey : undefined}
      />
    </div>
  );
}

function getSimulateMode(): SimulateMode | null {
  if (typeof window === "undefined") return null;
  const value = new URLSearchParams(window.location.search).get("simulate");
  if (!value) return null;
  return SIMULATE_MODES.includes(value as SimulateMode) ? (value as SimulateMode) : null;
}
