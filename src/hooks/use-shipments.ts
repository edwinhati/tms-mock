import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type {
  CreateShipmentRequest,
  Shipment,
  ShipmentLeg,
  ShipmentWithRelations,
  Vehicle,
} from "@/types/tms";

interface ShipmentsResponse {
  data: Shipment[];
  pagination: {
    limit: number;
    offset: number;
    totalCount: number;
    hasMore: boolean;
  };
}

async function fetchLocations(): Promise<Location[]> {
  return apiGet("/api/locations");
}

async function fetchVehicles(): Promise<Vehicle[]> {
  return apiGet("/api/vehicles");
}

async function createShipment(data: CreateShipmentRequest): Promise<Shipment> {
  return apiPost("/api/shipments", data);
}

async function fetchShipments(
  limit = 50,
  offset = 0,
  status?: string,
): Promise<ShipmentsResponse> {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  if (status) params.set("status", status);

  return apiGet(`/api/shipments?${params.toString()}`);
}

async function fetchShipment(id: string): Promise<ShipmentWithRelations> {
  return apiGet(`/api/shipments/${id}`);
}

async function updateShipmentStatus({
  id,
  status,
}: {
  id: string;
  status: string;
}): Promise<Shipment> {
  return apiPost(`/api/shipments/${id}/status`, { status });
}

async function updateLegStatus({
  shipmentId,
  legId,
  status,
  notes,
}: {
  shipmentId: string;
  legId: string;
  status: string;
  notes?: string;
}): Promise<ShipmentLeg> {
  return apiPost(`/api/shipments/${shipmentId}/legs/${legId}/status`, {
    status,
    notes,
  });
}

const DEFAULT_STALE_TIME = 30 * 1000;
const DETAIL_STALE_TIME = 60 * 1000;
const LIST_GC_TIME = 5 * 60 * 1000;
const DETAIL_GC_TIME = 10 * 60 * 1000;

export function useLocations() {
  return useQuery({
    queryKey: ["locations"],
    queryFn: fetchLocations,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useCreateShipment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createShipment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

interface UseShipmentsOptions {
  limit?: number;
  offset?: number;
  status?: string;
}

export function useShipments(options: UseShipmentsOptions = {}) {
  const { limit = 50, offset = 0, status } = options;

  return useQuery({
    queryKey: ["shipments", { limit, offset, status }],
    queryFn: () => fetchShipments(limit, offset, status),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: LIST_GC_TIME,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    placeholderData: (previousData) => previousData,
  });
}

export function useShipment(id: string) {
  return useQuery<ShipmentWithRelations>({
    queryKey: ["shipments", id],
    queryFn: () => fetchShipment(id),
    enabled: !!id,
    staleTime: DETAIL_STALE_TIME,
    gcTime: DETAIL_GC_TIME,
    refetchOnWindowFocus: false,
    retry: 2,
  });
}

export function useUpdateShipmentStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateShipmentStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({
        queryKey: ["shipments", variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateLegStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLegStatus,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["shipments", variables.shipmentId],
      });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
}
