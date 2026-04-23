import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api/client";
import type { Shipment, ShipmentWithRelations } from "@/types/tms";

async function fetchDriverShipments(): Promise<Shipment[]> {
  return apiGet("/api/driver/shipments");
}

export function useDriverShipments() {
  return useQuery({
    queryKey: ["driver", "shipments"],
    queryFn: fetchDriverShipments,
  });
}

async function fetchDriverShipment(id: string): Promise<ShipmentWithRelations> {
  return apiGet(`/api/driver/shipments/${id}`);
}

export function useDriverShipment(id: string) {
  return useQuery<ShipmentWithRelations>({
    queryKey: ["driver", "shipments", id],
    queryFn: () => fetchDriverShipment(id),
    enabled: !!id,
  });
}
