import { CACHE_VERSION, COLLECTOR_FRIENDLY } from "./config";
import type { Cache } from "./api";

/** Last successful dataset, kept in the visitor's own browser (IndexedDB). */
const DB = "pepegun-analytics";
const STORE = "kv";
const KEY = "dataset";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB unavailable"));
  });
}

function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => {
          db.close();
          resolve(req.result);
        };
        tx.onerror = tx.onabort = () => {
          db.close();
          reject(tx.error ?? new Error("IndexedDB transaction failed"));
        };
      }),
  );
}

export async function loadCache(): Promise<Cache | null> {
  try {
    const c = (await run("readonly", (s) => s.get(KEY))) as Cache | undefined;
    if (!c || c.v !== CACHE_VERSION || c.address !== COLLECTOR_FRIENDLY || !Array.isArray(c.rows))
      return null;
    return c;
  } catch {
    return null;
  }
}

/** Returns false when the browser refused to persist (private mode, quota). */
export async function saveCache(c: Cache): Promise<boolean> {
  try {
    await run("readwrite", (s) => s.put(c, KEY));
    return true;
  } catch {
    return false;
  }
}

export async function clearCache(): Promise<void> {
  try {
    await run("readwrite", (s) => s.delete(KEY));
  } catch {
    /* nothing to clear */
  }
}