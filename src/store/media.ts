/* Photos et notes vocales : stockées dans IndexedDB, hors de l'état JSON. */

const DB = 'savia-media';
const STORE = 'blobs';
const memory = new Map<string, Blob>();

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function putMedia(id: string, blob: Blob): Promise<void> {
  memory.set(id, blob);
  try { await run('readwrite', s => s.put(blob, id)); } catch { /* reste en mémoire pour cette session */ }
}

export async function getMedia(id: string): Promise<Blob | null> {
  if (memory.has(id)) return memory.get(id)!;
  try { return ((await run('readonly', s => s.get(id))) as Blob | undefined) ?? null; } catch { return null; }
}

export async function deleteMedia(id: string): Promise<void> {
  memory.delete(id);
  try { await run('readwrite', s => s.delete(id)); } catch { /* rien à faire */ }
}

/** Réduit une photo à 1200 px de large en JPEG pour garder l'appareil léger. */
export async function compressPhoto(file: File, max = 1200): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    });
    const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b ?? file), 'image/jpeg', 0.8));
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
