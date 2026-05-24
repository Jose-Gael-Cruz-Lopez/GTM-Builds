const DB_NAME = "nexoleal-scanner";
const DB_VERSION = 2;
const STORE = "config";
const STAFF_KEY = "staff-key";
const LEGACY_LOCAL_KEY = "nexoleal:staff-key";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
      if (!db.objectStoreNames.contains("scan-queue")) {
        db.createObjectStore("scan-queue", { keyPath: "id" });
      }
    };
  });
}

async function migrateLegacyStaffKey(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const legacy = localStorage.getItem(LEGACY_LOCAL_KEY);
  if (!legacy) return null;
  await setStaffKey(legacy);
  localStorage.removeItem(LEGACY_LOCAL_KEY);
  return legacy;
}

export async function getStaffKey(): Promise<string | null> {
  if (typeof indexedDB === "undefined") return null;
  try {
    const db = await openDb();
    const stored = await new Promise<string | null>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(STAFF_KEY);
      req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
      req.onerror = () => reject(req.error);
    });
    if (stored) return stored;
    return migrateLegacyStaffKey();
  } catch {
    return null;
  }
}

export async function setStaffKey(value: string): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).put(value.trim(), STAFF_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearStaffKey(): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(STAFF_KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  if (typeof window !== "undefined") {
    localStorage.removeItem(LEGACY_LOCAL_KEY);
  }
}

export function parseBusinessIdFromKey(key: string): string | null {
  const trimmed = key.trim();
  const idx = trimmed.indexOf(":");
  if (idx <= 0) return null;
  return trimmed.slice(0, idx);
}

export function isValidStaffKeyFormat(key: string): boolean {
  const trimmed = key.trim();
  return trimmed.includes(":") && trimmed.indexOf(":") > 0;
}

/** @deprecated Use automatic migration inside getStaffKey */
export async function migrateLegacyStaffKeyOnce(): Promise<void> {
  await migrateLegacyStaffKey();
}
