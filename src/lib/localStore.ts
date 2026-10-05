// Beta bez servera: postup hráča (profil, splnenia aj fotky) sa ukladá v telefóne — IndexedDB.
// IndexedDB zvládne aj fotky a videá, localStorage by mal strop ~5 MB.

const DB = 'questwave'
const STORE = 'state'
const KEY = 'v1'

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T | null> {
  return open()
    .then(
      (db) =>
        new Promise<T | null>((resolve) => {
          const req = fn(db.transaction(STORE, mode).objectStore(STORE))
          req.onsuccess = () => resolve((req.result as T) ?? null)
          req.onerror = () => resolve(null)
        }),
    )
    .catch(() => null)
}

export const loadState = <T>() => tx<T>('readonly', (s) => s.get(KEY))
export const saveState = (state: unknown) => tx('readwrite', (s) => s.put(state, KEY))
export const clearState = () => tx('readwrite', (s) => s.delete(KEY))

/** Požiada prehliadač, aby dáta appky nemazal sám od seba. */
export function keepStorage() {
  navigator.storage?.persist?.().catch(() => {})
}
