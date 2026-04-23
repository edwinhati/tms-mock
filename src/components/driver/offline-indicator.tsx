"use client";

import {
  AlertCircle,
  CheckCircle2,
  Database,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import * as storage from "@/lib/offline/storage";
import * as sync from "@/lib/offline/sync";
import type { SyncResult } from "@/lib/offline/types";

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const syncingRef = useRef(false);

  const updatePendingCount = useCallback(async () => {
    const updates = await storage.getPendingUpdates();
    setPendingCount(updates.length);
  }, []);

  const updateLastSyncTime = useCallback(async () => {
    const time = await storage.getLastSyncTime();
    setLastSyncTime(time);
  }, []);

  const performSync = useCallback(async () => {
    if (syncingRef.current || !sync.isOnline()) return;

    syncingRef.current = true;
    setIsSyncing(true);

    try {
      const result: SyncResult = await sync.syncPendingUpdates();
      await updatePendingCount();
      await updateLastSyncTime();

      if (result.synced.length > 0) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      }
    } finally {
      syncingRef.current = false;
      setIsSyncing(false);
    }
  }, [updatePendingCount, updateLastSyncTime]);

  useEffect(() => {
    setIsOnline(sync.isOnline());
    updatePendingCount();
    updateLastSyncTime();

    const cleanup = sync.setupNetworkListeners(
      async () => {
        setIsOnline(true);
        await updatePendingCount();
      },
      () => {
        setIsOnline(false);
      },
    );

    const interval = setInterval(() => {
      updatePendingCount();
      updateLastSyncTime();
    }, 5000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setIsOnline(sync.isOnline());
        updatePendingCount();
        updateLastSyncTime();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cleanup();
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [updatePendingCount, updateLastSyncTime]);

  useEffect(() => {
    if (isOnline && pendingCount > 0 && !syncingRef.current) {
      performSync();
    }
  }, [isOnline, pendingCount, performSync]);

  const formatLastSync = (timestamp: string | null) => {
    if (!timestamp) return "Never synced";

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <TooltipProvider>
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow-lg">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <div className="flex items-center gap-2 text-green-600">
                <Wifi className="w-4 h-4" />
                <span className="text-sm font-medium">Online</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-amber-600">
                <WifiOff className="w-4 h-4" />
                <span className="text-sm font-medium">Offline</span>
              </div>
            )}

            {pendingCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 text-amber-600">
                    <Database className="w-4 h-4" />
                    <span className="text-sm">{pendingCount} pending</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {pendingCount} update{pendingCount > 1 ? "s" : ""} waiting
                    to sync
                  </p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">
              {formatLastSync(lastSyncTime)}
            </span>

            {showSuccess ? (
              <div className="flex items-center gap-1 text-green-600 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4" />
                <span className="text-xs font-medium">Synced</span>
              </div>
            ) : pendingCount > 0 && isOnline ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={performSync}
                    disabled={isSyncing}
                    className="h-8 px-2"
                  >
                    <RefreshCw
                      className={`w-4 h-4 ${isSyncing ? "animate-spin" : ""}`}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Sync now</p>
                </TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </div>

        {!isOnline && pendingCount === 0 && (
          <div className="bg-amber-50 px-4 py-1.5 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs text-amber-700">
              You&apos;re offline. Data will be cached for viewing.
            </span>
          </div>
        )}

        {!isOnline && pendingCount > 0 && (
          <div className="bg-blue-50 px-4 py-1.5 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-blue-600" />
            <span className="text-xs text-blue-700">
              {pendingCount} update{pendingCount > 1 ? "s" : ""} will sync when
              you&apos;re back online
            </span>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
