"use client";

import {
  AlertCircle,
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock,
  Database,
  RefreshCw,
  Trash2,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import * as storage from "@/lib/offline/storage";
import * as sync from "@/lib/offline/sync";
import type { PendingUpdate } from "@/lib/offline/types";

export default function OfflineQueuePage() {
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  const loadPendingUpdates = useCallback(async () => {
    const updates = await storage.getPendingUpdates();
    setPendingUpdates(updates);
  }, []);

  const loadLastSyncTime = useCallback(async () => {
    const time = await storage.getLastSyncTime();
    setLastSyncTime(time);
  }, []);

  useEffect(() => {
    setIsOnline(sync.isOnline());
    loadPendingUpdates();
    loadLastSyncTime();

    const handleOnline = () => {
      setIsOnline(true);
      loadPendingUpdates();
    };

    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    const interval = setInterval(() => {
      loadPendingUpdates();
      loadLastSyncTime();
    }, 3000);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      clearInterval(interval);
    };
  }, [loadPendingUpdates, loadLastSyncTime]);

  const handleSync = async () => {
    if (isSyncing || !isOnline) return;

    setIsSyncing(true);
    try {
      await sync.syncPendingUpdates();
      await loadPendingUpdates();
      await loadLastSyncTime();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    if (confirm("Are you sure you want to clear all pending updates?")) {
      await storage.clear();
      await loadPendingUpdates();
    }
  };

  const handleRemoveItem = async (id: string) => {
    await storage.removePendingUpdate(id);
    await loadPendingUpdates();
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case "status":
        return <CheckCircle2 className="w-5 h-5 text-blue-600" />;
      case "photo":
        return <Camera className="w-5 h-5 text-purple-600" />;
      default:
        return <Database className="w-5 h-5 text-gray-600" />;
    }
  };

  const getUpdateLabel = (update: PendingUpdate) => {
    if (update.type === "status") {
      return `Status update: ${update.status}`;
    }
    if (update.type === "photo") {
      return `Photo upload: ${update.fileName}`;
    }
    return "Unknown update";
  };

  return (
    <div className="p-4 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/driver/shipments">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Offline Queue</h1>
      </div>

      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isOnline ? (
                <>
                  <Wifi className="w-5 h-5 text-green-600" />
                  <span className="text-green-700 font-medium">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-5 h-5 text-amber-600" />
                  <span className="text-amber-700 font-medium">Offline</span>
                </>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last sync</p>
              <p className="text-sm font-medium">
                {lastSyncTime ? formatTimestamp(lastSyncTime) : "Never"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              Pending Updates ({pendingUpdates.length})
            </CardTitle>
            {pendingUpdates.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearQueue}
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          {pendingUpdates.length === 0 ? (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No pending updates</p>
              <p className="text-sm text-gray-400 mt-1">
                All your updates have been synced
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingUpdates.map((update) => (
                <div
                  key={update.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="mt-0.5">{getUpdateIcon(update.type)}</div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {getUpdateLabel(update)}
                    </p>
                    <p className="text-xs text-gray-500">
                      Shipment: {update.shipmentId.slice(0, 8)}...
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span className="text-xs text-gray-400">
                        {formatTimestamp(update.timestamp)}
                      </span>
                      {update.retryCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          Retry: {update.retryCount}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveItem(update.id)}
                    className="shrink-0 h-8 w-8 text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {pendingUpdates.length > 0 && (
        <>
          <Button
            onClick={handleSync}
            disabled={isSyncing || !isOnline}
            className="w-full mb-3"
          >
            {isSyncing ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Sync Now
              </>
            )}
          </Button>

          {!isOnline && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-sm text-amber-700">
                Connect to the internet to sync your pending updates.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
