import type { EarthquakeCollection } from "./types";



const DB_NAME = "earthquake-cache";
const DB_VERSION = 1; 
const STORE = "queries";

const LIVE_TTL = 5 * 60 * 1000;
const HISTORICAL_TTL = 24 * 60 * 60 * 1000;

export interface CacheEntry {
  data: EarthquakeCollection;
  fetchedAt: number;
}

function localToday(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function ttlFor(endtime: string): number {
  return endtime >= localToday() ? LIVE_TTL : HISTORICAL_TTL;
}

let dbPromise: Promise<IDBDatabase | null> | null = null;

function getDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }

    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }

    request.onupgradeneeded = () => {
      const db = request.result;
      if (db.objectStoreNames.contains(STORE)) {
        db.deleteObjectStore(STORE);
      }
      db.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  body: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T | undefined> {
  return getDb().then(
    (db) =>
      new Promise<T | undefined>((resolve) => {
        if (!db) {
          resolve(undefined);
          return;
        }
        try {
          const tx = db.transaction(STORE, mode);
          const request = body(tx.objectStore(STORE));
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => resolve(undefined);
        } catch {
          resolve(undefined);
        }
      })
  );
}

export async function readEntry(
  key: string,
  ttl: number
): Promise<CacheEntry | null> {
  const entry = await run<CacheEntry>("readonly", (store) => store.get(key));
  if (!entry) return null;

  if (Date.now() - entry.fetchedAt > ttl) {
    void run("readwrite", (store) => store.delete(key));
    return null;
  }

  return entry;
}

export function writeEntry(key: string, entry: CacheEntry): void {
  void run("readwrite", (store) => store.put(entry, key));
}
