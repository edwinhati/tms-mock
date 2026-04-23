"use client";

import {
  ChevronRight,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDriverShipments } from "@/hooks/use-driver-shipments";
import * as storage from "@/lib/offline/storage";
import * as sync from "@/lib/offline/sync";
import type { Shipment } from "@/types/tms";
import { authClient } from "@/lib/auth/client";

export default function DriverShipmentsPage() {
  const router = useRouter();
  const {
    data: shipments,
    isLoading: isLoadingNetwork,
    refetch,
  } = useDriverShipments();
  const [cachedShipments, setCachedShipments] = useState<Shipment[]>([]);
  const [isLoadingCache, setIsLoadingCache] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    setIsOffline(!sync.isOnline());

    const loadCachedShipments = async () => {
      try {
        const cached = await storage.getShipments();
        setCachedShipments(cached);
      } catch (error) {
        console.error("Failed to load cached shipments:", error);
      } finally {
        setIsLoadingCache(false);
      }
    };

    loadCachedShipments();

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    if (shipments && shipments.length > 0) {
      storage.saveShipments(shipments);
      setCachedShipments(shipments);
    }
  }, [shipments]);

  const handleRefresh = async () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/auth/login");
        },
      },
    });
  };

  const isLoading = isLoadingNetwork && isLoadingCache;
  const displayShipments = shipments ?? cachedShipments;
  const isUsingCache = !shipments && cachedShipments.length > 0;

  if (isLoading) {
    return (
      <div className="p-4">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">My Shipments</h1>
          <p className="text-gray-500">Active deliveries assigned to you</p>
        </header>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 pb-20">
      <header className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Shipments</h1>
            <p className="text-gray-500">Active deliveries assigned to you</p>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing || isOffline}
              className="shrink-0"
            >
              <RefreshCw
                className={`w-5 h-5 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="shrink-0 text-muted-foreground hover:text-destructive"
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {isOffline && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span className="text-sm text-amber-700">
              {isUsingCache
                ? "You&apos;re offline. Showing cached data."
                : "You&apos;re offline. Connect to view shipments."}
            </span>
          </div>
        )}

        {isUsingCache && !isOffline && (
          <div className="mt-3 flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <WifiOff className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-sm text-blue-700">
              Showing cached data. Pull down to refresh.
            </span>
          </div>
        )}
      </header>

      {displayShipments && displayShipments.length > 0 ? (
        <div className="space-y-4">
          {displayShipments.map((shipment) => (
            <Link key={shipment.id} href={`/driver/shipments/${shipment.id}`}>
              <Card className="active:scale-95 transition-transform">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-semibold text-lg">
                        {shipment.shipmentNumber}
                      </p>
                      <p className="text-sm text-gray-500">
                        {new Date(shipment.createdAt).toLocaleDateString(
                          "id-ID",
                        )}
                      </p>
                    </div>
                    <StatusBadge status={shipment.status} />
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-600">
                        To:{" "}
                        {(shipment as any).destinationName ||
                          shipment.destinationId}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button variant="ghost" size="sm">
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No active shipments</p>
          <p className="text-sm text-gray-400">
            {isOffline
              ? "Connect to the internet to load your shipments"
              : "Check back later for new assignments"}
          </p>

          {isOffline && cachedShipments.length === 0 && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          )}
        </div>
      )}
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
