import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { DriverPerformance, Shipment, ShipmentStatus } from "@/types/tms";

export interface ReportFilters {
  startDate?: string;
  endDate?: string;
  status?: ShipmentStatus | "all";
  customerId?: string;
  driverId?: string;
  vehicleId?: string;
}

export interface ShipmentReportData extends Shipment {
  customerName?: string;
  originName?: string;
  destinationName?: string;
  driverName?: string;
  vehiclePlate?: string;
  totalWeight?: number;
  totalRevenue?: number;
}

export interface ReportStats {
  totalShipments: number;
  totalWeight: number;
  totalRevenue: number;
  averageDeliveryTime: number;
  shipmentsByStatus: Record<ShipmentStatus, number>;
}

async function fetchShipmentReports(
  filters: ReportFilters,
): Promise<ShipmentReportData[]> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);
  if (filters.status && filters.status !== "all")
    params.append("status", filters.status);
  if (filters.customerId) params.append("customerId", filters.customerId);

  const response = await apiGet<{ data: ShipmentReportData[] }>(
    `/api/reports/shipments?${params.toString()}`,
  );
  return response.data;
}

async function fetchDriverPerformance(
  filters: Pick<ReportFilters, "startDate" | "endDate">,
): Promise<DriverPerformance[]> {
  const params = new URLSearchParams();

  if (filters.startDate) params.append("startDate", filters.startDate);
  if (filters.endDate) params.append("endDate", filters.endDate);

  return apiGet<DriverPerformance[]>(
    `/api/reports/drivers?${params.toString()}`,
  );
}

async function fetchReportStats(filters: ReportFilters): Promise<ReportStats> {
  // Fetch shipment reports and calculate stats
  const shipments = await fetchShipmentReports(filters);

  const stats: ReportStats = {
    totalShipments: shipments.length,
    totalWeight: shipments.reduce((sum, s) => sum + (s.totalWeight || 0), 0),
    totalRevenue: shipments.reduce((sum, s) => sum + (s.totalRevenue || 0), 0),
    averageDeliveryTime: 0,
    shipmentsByStatus: {
      planned: 0,
      in_transit: 0,
      delivered: 0,
      cancelled: 0,
    },
  };

  // Calculate shipments by status
  for (const shipment of shipments) {
    stats.shipmentsByStatus[shipment.status]++;
  }

  // Calculate average delivery time for delivered shipments
  const deliveredShipments = shipments.filter(
    (s) => s.status === "delivered" && s.actualDate && s.scheduledDate,
  );

  if (deliveredShipments.length > 0) {
    const totalDeliveryTime = deliveredShipments.reduce((sum, s) => {
      const scheduled = s.scheduledDate
        ? new Date(s.scheduledDate).getTime()
        : 0;
      const actual = s.actualDate ? new Date(s.actualDate).getTime() : 0;
      return sum + (actual - scheduled) / (1000 * 60 * 60);
    }, 0);
    stats.averageDeliveryTime = Math.round(
      totalDeliveryTime / deliveredShipments.length,
    );
  }

  return stats;
}

export function useShipmentReports(filters: ReportFilters) {
  return useQuery({
    queryKey: ["reports", "shipments", filters],
    queryFn: () => fetchShipmentReports(filters),
  });
}

export function useDriverPerformance(
  filters: Pick<ReportFilters, "startDate" | "endDate">,
) {
  return useQuery({
    queryKey: ["reports", "drivers", filters],
    queryFn: () => fetchDriverPerformance(filters),
  });
}

export function useReportStats(filters: ReportFilters) {
  return useQuery({
    queryKey: ["reports", "stats", filters],
    queryFn: () => fetchReportStats(filters),
  });
}
