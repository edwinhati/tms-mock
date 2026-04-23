import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { CreateVehicleInput, Vehicle } from "@/types/tms";

const API_BASE = "/api/vehicles";

async function fetchVehicles(): Promise<Vehicle[]> {
  return apiGet<Vehicle[]>(API_BASE);
}

async function fetchVehicle(id: string): Promise<Vehicle> {
  return apiGet<Vehicle>(`${API_BASE}/${id}`);
}

async function createVehicle(data: CreateVehicleInput): Promise<Vehicle> {
  return apiPost<Vehicle>(API_BASE, data);
}

async function updateVehicle(
  id: string,
  data: Partial<CreateVehicleInput>,
): Promise<Vehicle> {
  return apiPut<Vehicle>(`${API_BASE}/${id}`, data);
}

async function deleteVehicle(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/${id}`);
}

export function useVehicles() {
  return useQuery({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
  });
}

export function useVehicle(id: string) {
  return useQuery({
    queryKey: ["vehicles", id],
    queryFn: () => fetchVehicle(id),
    enabled: !!id,
  });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}

export function useUpdateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateVehicleInput>;
    }) => updateVehicle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
      queryClient.invalidateQueries({ queryKey: ["vehicles", variables.id] });
    },
  });
}

export function useDeleteVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteVehicle,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicles"] });
    },
  });
}
