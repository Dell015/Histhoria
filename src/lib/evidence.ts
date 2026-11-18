export const maxEvidenceBytes = 50 * 1024 * 1024;

type BaseEvidence = {
  id: string;
  universeId: string;
  claimId: string;
  title: string;
  note: string;
  createdAt: number;
};

export type Evidence = BaseEvidence & (
  { kind: "link"; url: string } |
  { kind: "file"; blob: Blob; filename: string }
);

export function evidenceUrl(input: string) {
  const url = new URL(input.trim());
  if ((url.protocol !== "https:" && url.protocol !== "http:") || url.username || url.password) {
    throw new Error("Enter an HTTP or HTTPS link without login credentials.");
  }
  return url.href;
}

export function previewKind(mime: string) {
  if (/^image\/(png|jpeg|webp|gif|avif|bmp|x-icon)$/.test(mime)) return "image";
  if (/^video\/(mp4|webm|ogg|quicktime)$/.test(mime)) return "video";
  if (/^audio\/(mpeg|mp4|webm|ogg|wav|x-wav|flac|aac)$/.test(mime)) return "audio";
  return "download";
}

function openEvidence() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("histhoria-evidence", 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore("attachments", { keyPath: "id" });
      store.createIndex("claim", ["universeId", "claimId"]);
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function access<T>(mode: IDBTransactionMode, operation: (store: IDBObjectStore) => IDBRequest<T>) {
  const db = await openEvidence();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = db.transaction("attachments", mode);
      const request = operation(transaction.objectStore("attachments"));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onabort = () => reject(transaction.error ?? request.error);
    });
  } finally {
    db.close();
  }
}

export async function listEvidence(universeId: string, claimId: string): Promise<Evidence[]> {
  const entries: Evidence[] = await access("readonly", (store) => store.index("claim").getAll([universeId, claimId]));
  return entries.sort((a, b) => a.createdAt - b.createdAt);
}

export async function saveEvidence(entry: Evidence) {
  await access("readwrite", (store) => store.add(entry));
}

export async function removeEvidence(id: string) {
  await access("readwrite", (store) => store.delete(id));
}
