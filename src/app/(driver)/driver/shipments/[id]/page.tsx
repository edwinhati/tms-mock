"use client";

import { format } from "date-fns";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  Clock,
  Database,
  Loader2,
  MapPin,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useDriverShipment } from "@/hooks/use-driver-shipments";
import * as storage from "@/lib/offline/storage";
import * as sync from "@/lib/offline/sync";
import type { ShipmentWithRelations } from "@/types/tms";

export default function DriverShipmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data: shipment, isLoading: isLoadingNetwork } = useDriverShipment(id);
  const [cachedShipment, setCachedShipment] =
    useState<ShipmentWithRelations | null>(null);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [notes, setNotes] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [showOfflineToast, setShowOfflineToast] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updatePendingCount = useCallback(async () => {
    const updates = await storage.getPendingUpdates();
    const count = updates.filter((u) => u.shipmentId === id).length;
    setPendingCount(count);
  }, [id]);

  useEffect(() => {
    setIsOffline(!sync.isOnline());

    const loadCachedShipment = async () => {
      try {
        const cached = await storage.getShipmentDetail(id);
        setCachedShipment(cached);
      } catch (error) {
        console.error("Failed to load cached shipment:", error);
      } finally {
        setIsLoadingCache(false);
      }
    };

    loadCachedShipment();
    updatePendingCount();

    const handleOnline = () => {
      setIsOffline(false);
      updatePendingCount();
    };

    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [id, updatePendingCount]);

  useEffect(() => {
    if (shipment) {
      storage.saveShipmentDetail(shipment);
      setCachedShipment(shipment);
    }
  }, [shipment]);

  const isLoading = isLoadingNetwork && isLoadingCache;
  const displayShipment = shipment ?? cachedShipment;
  const isUsingCache = !shipment && cachedShipment !== null;

  const currentLeg = displayShipment?.legs?.find(
    (leg) => leg.status !== "completed",
  );

  const handleStatusUpdate = async (newStatus: string) => {
    setIsUpdating(true);

    try {
      if (isOffline) {
        await storage.queueStatusUpdate(id, newStatus, {
          legId: currentLeg?.id,
          notes,
        });

        await sync.registerBackgroundSync("sync-status-updates");
        setShowOfflineToast(true);
        setTimeout(() => setShowOfflineToast(false), 5000);
        await updatePendingCount();
      } else {
        const res = await fetch(`/api/driver/shipments/${id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            legId: currentLeg?.id,
            status: newStatus,
            notes,
          }),
        });

        if (!res.ok) throw new Error("Failed to update status");

        router.refresh();
      }
    } catch (error) {
      console.error("Failed to update status:", error);

      try {
        await storage.queueStatusUpdate(id, newStatus, {
          legId: currentLeg?.id,
          notes,
        });
        await sync.registerBackgroundSync("sync-status-updates");
        setShowOfflineToast(true);
        setTimeout(() => setShowOfflineToast(false), 5000);
        await updatePendingCount();
      } catch (_queueError) {
        alert("Failed to save update. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUpdating(true);

    try {
      if (isOffline) {
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        await storage.queuePhotoUpload(id, blob, {
          legId: currentLeg?.id,
          type: "photo",
          fileName: file.name,
        });

        await sync.registerBackgroundSync("sync-photo-uploads");
        setShowOfflineToast(true);
        setTimeout(() => setShowOfflineToast(false), 5000);
        await updatePendingCount();
      } else {
        const formData = new FormData();
        formData.append("photo", file);
        formData.append("legId", currentLeg?.id || "");
        formData.append("type", "photo");

        const res = await fetch(`/api/driver/shipments/${id}/photo`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Failed to upload photo");

        alert("Photo uploaded successfully");
      }
    } catch (error) {
      console.error("Failed to upload photo:", error);

      try {
        const blob = new Blob([await file.arrayBuffer()], { type: file.type });
        await storage.queuePhotoUpload(id, blob, {
          legId: currentLeg?.id,
          type: "photo",
          fileName: file.name,
        });

        await sync.registerBackgroundSync("sync-photo-uploads");
        setShowOfflineToast(true);
        setTimeout(() => setShowOfflineToast(false), 5000);
        await updatePendingCount();
      } catch (_queueError) {
        alert("Failed to queue photo. Please try again.");
      }
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-64 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!displayShipment) {
    return (
      <div className="p-4">
        <h1 className="text-xl font-bold">Shipment not found</h1>
        <Button asChild className="mt-4">
          <Link href="/driver/shipments">Back</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/driver/shipments">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Shipment Detail</h1>
      </div>

      {isUsingCache && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span className="text-sm text-amber-700">
            Showing cached data. Connect to the internet for the latest
            information.
          </span>
        </div>
      )}

      {showOfflineToast && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
          <Database className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-sm text-blue-700">
            Update saved locally and will sync when you&apos;re back online.
          </span>
        </div>
      )}

      {pendingCount > 0 && (
        <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="text-sm text-purple-700">
              {pendingCount} update{pendingCount > 1 ? "s" : ""} pending sync
              for this shipment
            </span>
          </div>
        </div>
      )}

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <p className="font-bold text-lg">
                {displayShipment.shipmentNumber}
              </p>
              <p className="text-sm text-gray-500">
                {format(new Date(displayShipment.createdAt), "MMM dd, yyyy")}
              </p>
            </div>
            <StatusBadge status={displayShipment.status} />
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>From: {displayShipment.originName || "-"}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>To: {displayShipment.destinationName || "-"}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {currentLeg && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Current Leg</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2 text-sm">
              <p>
                <span className="text-gray-500">From:</span>{" "}
                {currentLeg.originName}
              </p>
              <p>
                <span className="text-gray-500">To:</span>{" "}
                {currentLeg.destinationName}
              </p>
              <p>
                <span className="text-gray-500">Status:</span>{" "}
                <LegStatusBadge status={currentLeg.status} />
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Items</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {displayShipment.items && displayShipment.items.length > 0 ? (
            <div className="space-y-2">
              {displayShipment.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between text-sm py-2 border-b last:border-0"
                >
                  <span>{item.goods?.description}</span>
                  <span className="font-medium">
                    {item.quantity} {item.goods?.unit}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No items</p>
          )}
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Update Status</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <Textarea
            placeholder="Add notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[80px]"
            disabled={isUpdating || isOffline}
          />

          <div className="grid grid-cols-2 gap-2">
            {currentLeg?.status === "pending" && (
              <Button
                onClick={() => handleStatusUpdate("in_progress")}
                disabled={isUpdating}
                className="w-full"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Clock className="w-4 h-4 mr-1" />
                    Start
                  </>
                )}
              </Button>
            )}
            {currentLeg?.status === "in_progress" && (
              <Button
                onClick={() => handleStatusUpdate("completed")}
                disabled={isUpdating}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                {isUpdating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Complete
                  </>
                )}
              </Button>
            )}
          </div>

          {isOffline && (
            <p className="text-xs text-amber-600">
              You&apos;re offline. Status will be queued and synced when back
              online.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Upload Photo</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUpdating}
          >
            <Camera className="w-4 h-4 mr-2" />
            {isOffline ? "Queue Photo (Offline)" : "Take Photo"}
          </Button>

          {isOffline && (
            <p className="mt-2 text-xs text-amber-600">
              Photo will be saved locally and uploaded when you&apos;re back
              online.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    planned: "bg-blue-100 text-blue-800",
    in_transit: "bg-purple-100 text-purple-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <Badge className={variants[status] || "bg-gray-100"}>
      {status.replace("_", " ")}
    </Badge>
  );
}

function LegStatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    in_progress: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };

  return (
    <span
      className={`text-xs px-2 py-1 rounded-full ${variants[status] || "bg-gray-100"}`}
    >
      {status.replace("_", " ")}
    </span>
  );
}
