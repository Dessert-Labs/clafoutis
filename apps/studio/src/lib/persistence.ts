import type { DTCGTokenFile } from "@clafoutis/studio-core";

const DB_NAME = "clafoutis-studio";
const STORE_NAME = "drafts";
const DB_VERSION = 1;

interface DraftData {
  projectId: string;
  tokenFiles: Record<string, DTCGTokenFile>;
  baselineSha: string;
  savedAt: number;
}

let dbConnection: IDBDatabase | null = null;
let dbPromise: Promise<IDBDatabase> | null = null;

function resetConnection(): void {
  dbConnection = null;
  dbPromise = null;
}

function openDB(): Promise<IDBDatabase> {
  if (dbConnection) {
    return Promise.resolve(dbConnection);
  }

  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "projectId" });
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      dbConnection = db;
      resolve(db);
    };
    request.onerror = () => {
      resetConnection();
      reject(request.error);
    };
  });

  return dbPromise;
}

async function getDB(): Promise<IDBDatabase> {
  try {
    return await openDB();
  } catch {
    resetConnection();
    return await openDB();
  }
}

export async function saveDraft(
  projectId: string,
  tokenFiles: Record<string, DTCGTokenFile>,
  baselineSha: string,
): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const data: DraftData = {
      projectId,
      tokenFiles,
      baselineSha,
      savedAt: Date.now(),
    };
    store.put(data);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        resetConnection();
        reject(tx.error);
      };
    });
  } catch (error) {
    resetConnection();
    throw error;
  }
}

export async function loadDraft(projectId: string): Promise<DraftData | null> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.get(projectId);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => {
        resetConnection();
        reject(request.error);
      };
    });
  } catch (error) {
    resetConnection();
    throw error;
  }
}

export async function clearDraft(projectId: string): Promise<void> {
  try {
    const db = await getDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    store.delete(projectId);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => {
        resetConnection();
        reject(tx.error);
      };
    });
  } catch (error) {
    resetConnection();
    throw error;
  }
}

export async function hasDraft(projectId: string): Promise<boolean> {
  const draft = await loadDraft(projectId);
  return draft !== null;
}
