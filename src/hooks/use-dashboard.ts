import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { DashboardStats, Shipment } from "@/types/tms";

async function fetchDashboardStats(): Promise<DashboardStats> {
  return apiGet("/api/dashboard/stats");
}

async function fetchRecentShipments(): Promise<Shipment[]> {
  return apiGet("/api/dashboard/shipments?limit=10");
}

const STATS_STALE_TIME = 30 * 1000;
const SHIPMENTS_STALE_TIME = 15 * 1000;
const GC_TIME = 5 * 60 * 1000;

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: fetchDashboardStats,
    staleTime: STATS_STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    retry: 2,
  });
}

export function useRecentShipments() {
  return useQuery({
    queryKey: ["dashboard", "shipments"],
    queryFn: fetchRecentShipments,
    staleTime: SHIPMENTS_STALE_TIME,
    gcTime: GC_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });
}
