import * as storage from "./storage";
import type {
  PendingPhotoUpload,
  PendingStatusUpdate,
  PendingUpdate,
  SyncResult,
} from "./types";

export function isOnline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine;
}

export function setupNetworkListeners(
  onOnline: () => void,
  onOffline: () => void,
): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleOnline = () => {
    console.log("[Network] Online");
    onOnline();
  };

  const handleOffline = () => {
    console.log("[Network] Offline");
    onOffline();
  };

  window.addEventListener("online", handleOnline);
  window.addEventListener("offline", handleOffline);

  return () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };
}

export async function registerBackgroundSync(tag: string): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.serviceWorker?.ready) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;

    if ("sync" in registration) {
      await (
        registration as ServiceWorkerRegistration & {
          sync: { register(tag: string): Promise<void> };
        }
      ).sync.register(tag);
      console.log(`[Sync] Registered background sync: ${tag}`);
      return true;
    }

    console.log("[Sync] Background sync not supported");
    return false;
  } catch (error) {
    console.error("[Sync] Failed to register background sync:", error);
    return false;
  }
}

export async function syncPendingUpdates(): Promise<SyncResult> {
  if (!isOnline()) {
    return {
      success: false,
      synced: [],
      failed: [],
      remaining: 0,
    };
  }

  const result: SyncResult = {
    success: true,
    synced: [],
    failed: [],
    remaining: 0,
  };

  try {
    const pendingUpdates = await storage.getPendingUpdates();

    if (pendingUpdates.length === 0) {
      return result;
    }

    console.log(
      `[Sync] Starting sync of ${pendingUpdates.length} pending updates`,
    );

    for (const update of pendingUpdates) {
      try {
        if (update.type === "status") {
          await syncStatusUpdate(update);
        } else if (update.type === "photo") {
          await syncPhotoUpload(update);
        }

        await storage.removePendingUpdate(update.id);
        result.synced.push(update.id);
      } catch (error) {
        console.error(`[Sync] Failed to sync update ${update.id}:`, error);

        await storage.incrementRetryCount(update.id);

        result.failed.push({
          id: update.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

    result.success = result.failed.length === 0;
    result.remaining = result.failed.length;

    if (result.success) {
      await storage.setLastSyncTime(new Date().toISOString());
    }

    console.log(
      `[Sync] Completed: ${result.synced.length} synced, ${result.failed.length} failed`,
    );

    return result;
  } catch (error) {
    console.error("[Sync] Error during sync:", error);
    result.success = false;
    return result;
  }
}

async function syncStatusUpdate(
  update: PendingStatusUpdate & { type: "status" },
): Promise<void> {
  const response = await fetch(
    `/api/driver/shipments/${update.shipmentId}/status`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        legId: update.legId,
        status: update.status,
        notes: update.notes,
        latitude: update.latitude,
        longitude: update.longitude,
      }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }
}

async function syncPhotoUpload(
  update: PendingPhotoUpload & { type: "photo" },
): Promise<void> {
  const blob = await storage.getPhotoBlob(update.id);

  if (!blob) {
    throw new Error("Photo blob not found in storage");
  }

  const formData = new FormData();
  formData.append("photo", blob, update.fileName);
  formData.append("legId", update.legId || "");
  formData.append("type", update.type);

  const response = await fetch(
    `/api/driver/shipments/${update.shipmentId}/photo`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error: ${response.status} - ${error}`);
  }
}

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      console.log("[SW] Service workers not supported");
      return null;
    }

    const registration = await navigator.serviceWorker.register("/sw.js");

    console.log("[SW] Service worker registered:", registration.scope);

    registration.addEventListener("updatefound", () => {
      const newWorker = registration.installing;

      if (newWorker) {
        newWorker.addEventListener("statechange", () => {
          if (
            newWorker.state === "installed" &&
            navigator.serviceWorker.controller
          ) {
            console.log("[SW] New version available, triggering update...");
            newWorker.postMessage({ type: "SKIP_WAITING" });
          }
        });
      }
    });

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data?.type === "SYNC_PENDING_UPDATES") {
        console.log("[SW] Received sync message from service worker");
        syncPendingUpdates();
      }

      if (event.data?.type === "SYNC_PHOTO_UPLOADS") {
        console.log("[SW] Received photo sync message from service worker");
        syncPendingUpdates();
      }
    });

    return registration;
  } catch (error) {
    console.error("[SW] Service worker registration failed:", error);
    return null;
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const result = await registration.unregister();

    console.log("[SW] Service worker unregistered:", result);
    return result;
  } catch (error) {
    console.error("[SW] Failed to unregister service worker:", error);
    return false;
  }
}

export async function checkForUpdates(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    await registration.update();

    return !!registration.waiting;
  } catch (error) {
    console.error("[SW] Failed to check for updates:", error);
    return false;
  }
}

export async function activateUpdate(): Promise<void> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    if (registration.waiting) {
      registration.waiting.postMessage({ type: "SKIP_WAITING" });
    }
  } catch (error) {
    console.error("[SW] Failed to activate update:", error);
  }
}
