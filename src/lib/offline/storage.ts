import type { Shipment, ShipmentWithRelations } from "@/types/tms";
import type {
  PendingPhotoUpload,
  PendingStatusUpdate,
  PendingUpdate,
} from "./types";

const DB_NAME = "TMS_Driver_Offline";
const DB_VERSION = 1;

const STORES = {
  SHIPMENTS: "shipments",
  SHIPMENT_DETAILS: "shipment_details",
  PENDING_UPDATES: "pending_updates",
  PHOTO_BLOBS: "photo_blobs",
  METADATA: "metadata",
} as const;

let db: IDBDatabase | null = null;

async function getDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      if (!database.objectStoreNames.contains(STORES.SHIPMENTS)) {
        database.createObjectStore(STORES.SHIPMENTS, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(STORES.SHIPMENT_DETAILS)) {
        database.createObjectStore(STORES.SHIPMENT_DETAILS, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(STORES.PENDING_UPDATES)) {
        database.createObjectStore(STORES.PENDING_UPDATES, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(STORES.PHOTO_BLOBS)) {
        database.createObjectStore(STORES.PHOTO_BLOBS, { keyPath: "id" });
      }

      if (!database.objectStoreNames.contains(STORES.METADATA)) {
        database.createObjectStore(STORES.METADATA);
      }
    };
  });
}

async function getStore(
  storeName: string,
  mode: IDBTransactionMode = "readonly",
): Promise<IDBObjectStore> {
  const database = await getDB();
  const transaction = database.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const store = await getStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result as T[]);
  });
}

async function getFromStore<T>(
  storeName: string,
  key: string,
): Promise<T | null> {
  const store = await getStore(storeName);

  return new Promise((resolve, reject) => {
    const request = store.get(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve((request.result as T) || null);
  });
}

async function putToStore<T>(
  storeName: string,
  value: T & { id: string },
): Promise<void> {
  const store = await getStore(storeName, "readwrite");

  return new Promise((resolve, reject) => {
    const request = store.put(value);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function deleteFromStore(storeName: string, key: string): Promise<void> {
  const store = await getStore(storeName, "readwrite");

  return new Promise((resolve, reject) => {
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function clearStore(storeName: string): Promise<void> {
  const store = await getStore(storeName, "readwrite");

  return new Promise((resolve, reject) => {
    const request = store.clear();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function saveShipments(shipments: Shipment[]): Promise<void> {
  try {
    const database = await getDB();
    const transaction = database.transaction(STORES.SHIPMENTS, "readwrite");
    const store = transaction.objectStore(STORES.SHIPMENTS);

    for (const shipment of shipments) {
      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          ...shipment,
          cachedAt: new Date().toISOString(),
        });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      });
    }

    await new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (error) {
    console.error("Failed to save shipments:", error);
    throw error;
  }
}

export async function getShipments(): Promise<Shipment[]> {
  try {
    const shipments = await getAllFromStore<Shipment & { cachedAt: string }>(
      STORES.SHIPMENTS,
    );
    return shipments.map(({ cachedAt, ...shipment }) => shipment);
  } catch (error) {
    console.error("Failed to get shipments:", error);
    return [];
  }
}

export async function saveShipmentDetail(
  shipment: ShipmentWithRelations,
): Promise<void> {
  try {
    await putToStore(STORES.SHIPMENT_DETAILS, {
      ...shipment,
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to save shipment detail:", error);
    throw error;
  }
}

export async function getShipmentDetail(
  id: string,
): Promise<ShipmentWithRelations | null> {
  try {
    const result = await getFromStore<
      ShipmentWithRelations & { cachedAt: string }
    >(STORES.SHIPMENT_DETAILS, id);
    if (!result) return null;
    const { cachedAt, ...shipment } = result;
    return shipment;
  } catch (error) {
    console.error("Failed to get shipment detail:", error);
    return null;
  }
}

export async function queueStatusUpdate(
  shipmentId: string,
  status: string,
  options?: {
    legId?: string;
    notes?: string;
    latitude?: number;
    longitude?: number;
  },
): Promise<PendingStatusUpdate> {
  const update: PendingStatusUpdate = {
    id: crypto.randomUUID(),
    shipmentId,
    legId: options?.legId,
    status,
    notes: options?.notes,
    latitude: options?.latitude,
    longitude: options?.longitude,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  try {
    const store = await getStore(STORES.PENDING_UPDATES, "readwrite");

    await new Promise<void>((resolve, reject) => {
      const request = store.add({ ...update, type: "status" as const });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });

    return update;
  } catch (error) {
    console.error("Failed to queue status update:", error);
    throw error;
  }
}

export async function queuePhotoUpload(
  shipmentId: string,
  photoBlob: Blob,
  options?: {
    legId?: string;
    type?: "photo" | "bast" | "signature";
    fileName?: string;
  },
): Promise<PendingPhotoUpload> {
  const id = crypto.randomUUID();

  const upload: PendingPhotoUpload = {
    id,
    shipmentId,
    legId: options?.legId,
    type: options?.type || "photo",
    photoBlob,
    fileName: options?.fileName || `photo-${Date.now()}.jpg`,
    timestamp: new Date().toISOString(),
    retryCount: 0,
  };

  try {
    const db = await getDB();
    const transaction = db.transaction(
      [STORES.PHOTO_BLOBS, STORES.PENDING_UPDATES],
      "readwrite",
    );

    const blobStore = transaction.objectStore(STORES.PHOTO_BLOBS);
    const pendingStore = transaction.objectStore(STORES.PENDING_UPDATES);

    await Promise.all([
      new Promise<void>((resolve, reject) => {
        const request = blobStore.put({ id, blob: photoBlob });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      }),
      new Promise<void>((resolve, reject) => {
        const request = pendingStore.add({
          id,
          shipmentId,
          legId: options?.legId,
          type: "photo",
          photoType: options?.type || "photo",
          fileName: upload.fileName,
          timestamp: upload.timestamp,
          retryCount: 0,
        });
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve();
      }),
    ]);

    return upload;
  } catch (error) {
    console.error("Failed to queue photo upload:", error);
    throw error;
  }
}

export async function getPendingUpdates(): Promise<PendingUpdate[]> {
  try {
    const updates = await getAllFromStore<PendingUpdate>(
      STORES.PENDING_UPDATES,
    );
    return updates.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );
  } catch (error) {
    console.error("Failed to get pending updates:", error);
    return [];
  }
}

export async function getPendingStatusUpdates(): Promise<
  (PendingStatusUpdate & { type: "status" })[]
> {
  const updates = await getPendingUpdates();
  return updates.filter(
    (u): u is PendingStatusUpdate & { type: "status" } => u.type === "status",
  );
}

export async function getPendingPhotoUploads(): Promise<
  (PendingPhotoUpload & { type: "photo" })[]
> {
  const updates = await getPendingUpdates();
  return updates.filter(
    (u): u is PendingPhotoUpload & { type: "photo" } => u.type === "photo",
  );
}

export async function getPhotoBlob(id: string): Promise<Blob | null> {
  try {
    const result = await getFromStore<{ id: string; blob: Blob }>(
      STORES.PHOTO_BLOBS,
      id,
    );
    return result?.blob || null;
  } catch (error) {
    console.error("Failed to get photo blob:", error);
    return null;
  }
}

export async function removePendingUpdate(id: string): Promise<void> {
  try {
    const update = await getFromStore<PendingUpdate>(
      STORES.PENDING_UPDATES,
      id,
    );

    if (update?.type === "photo") {
      await deleteFromStore(STORES.PHOTO_BLOBS, id);
    }

    await deleteFromStore(STORES.PENDING_UPDATES, id);
  } catch (error) {
    console.error("Failed to remove pending update:", error);
    throw error;
  }
}

export async function incrementRetryCount(id: string): Promise<void> {
  try {
    const update = await getFromStore<PendingUpdate>(
      STORES.PENDING_UPDATES,
      id,
    );
    if (!update) return;

    const store = await getStore(STORES.PENDING_UPDATES, "readwrite");

    await new Promise<void>((resolve, reject) => {
      const request = store.put({
        ...update,
        retryCount: update.retryCount + 1,
      });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to increment retry count:", error);
  }
}

export async function clear(): Promise<void> {
  try {
    await Promise.all([
      clearStore(STORES.SHIPMENTS),
      clearStore(STORES.SHIPMENT_DETAILS),
      clearStore(STORES.PENDING_UPDATES),
      clearStore(STORES.PHOTO_BLOBS),
      clearStore(STORES.METADATA),
    ]);

    if (
      typeof navigator !== "undefined" &&
      navigator.serviceWorker?.controller
    ) {
      navigator.serviceWorker.controller.postMessage({ type: "CLEAR_CACHES" });
    }
  } catch (error) {
    console.error("Failed to clear offline storage:", error);
    throw error;
  }
}

export async function getLastSyncTime(): Promise<string | null> {
  try {
    const store = await getStore(STORES.METADATA);

    return new Promise((resolve, reject) => {
      const request = store.get("lastSync");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (error) {
    console.error("Failed to get last sync time:", error);
    return null;
  }
}

export async function setLastSyncTime(timestamp: string): Promise<void> {
  try {
    const store = await getStore(STORES.METADATA, "readwrite");

    await new Promise<void>((resolve, reject) => {
      const request = store.put(timestamp, "lastSync");
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    console.error("Failed to set last sync time:", error);
  }
}
