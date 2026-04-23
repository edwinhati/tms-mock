import type { Shipment, ShipmentWithRelations } from "@/types/tms";

export interface PendingStatusUpdate {
  id: string;
  shipmentId: string;
  legId?: string;
  status: string;
  notes?: string;
  latitude?: number;
  longitude?: number;
  timestamp: string;
  retryCount: number;
}

export interface PendingPhotoUpload {
  id: string;
  shipmentId: string;
  legId?: string;
  type: "photo" | "bast" | "signature";
  photoBlob: Blob;
  fileName: string;
  timestamp: string;
  retryCount: number;
}

export type PendingUpdate =
  | (PendingStatusUpdate & { type: "status" })
  | (PendingPhotoUpload & { type: "photo" });

export interface SyncResult {
  success: boolean;
  synced: string[];
  failed: { id: string; error: string }[];
  remaining: number;
}

export interface OfflineStorageData {
  shipments: Shipment[];
  shipmentDetails: Record<string, ShipmentWithRelations>;
  pendingUpdates: PendingUpdate[];
  lastSync: string | null;
}

export interface NetworkStatus {
  isOnline: boolean;
  pendingCount: number;
  lastSync: string | null;
}
