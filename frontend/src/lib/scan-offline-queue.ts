const DB_NAME = 'nexoleal-scanner'
const DB_VERSION = 2
const QUEUE_STORE = 'scan-queue'

export interface QueuedScan {
  id: string
  token: string
  queuedAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onerror = () => reject(req.error)
    req.onsuccess = () => resolve(req.result)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('config')) {
        db.createObjectStore('config')
      }
      if (!db.objectStoreNames.contains(QUEUE_STORE)) {
        db.createObjectStore(QUEUE_STORE, { keyPath: 'id' })
      }
    }
  })
}

export async function enqueueScan(token: string): Promise<QueuedScan> {
  const item: QueuedScan = {
    id: crypto.randomUUID(),
    token,
    queuedAt: Date.now(),
  }
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).add(item)
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => {
      db.close()
      resolve(item)
    }
  })
}

export async function listQueuedScans(): Promise<QueuedScan[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readonly')
    const req = tx.objectStore(QUEUE_STORE).getAll()
    req.onerror = () => reject(req.error)
    req.onsuccess = () => {
      const items = (req.result as QueuedScan[]).sort((a, b) => a.queuedAt - b.queuedAt)
      resolve(items)
    }
    tx.oncomplete = () => db.close()
  })
}

export async function removeQueuedScan(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(QUEUE_STORE, 'readwrite')
    tx.objectStore(QUEUE_STORE).delete(id)
    tx.onerror = () => reject(tx.error)
    tx.oncomplete = () => {
      db.close()
      resolve()
    }
  })
}

export async function replayQueuedScans(
  register: (token: string) => Promise<unknown>,
): Promise<{ processed: number; failed: number }> {
  const items = await listQueuedScans()
  let processed = 0
  let failed = 0

  for (const item of items) {
    try {
      await register(item.token)
      await removeQueuedScan(item.id)
      processed++
    } catch {
      failed++
    }
  }

  return { processed, failed }
}
