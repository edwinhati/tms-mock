import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { WarehouseFormValues } from "@/lib/schemas";
import type { Warehouse } from "@/types/tms";

const API_BASE = "/api/warehouses";

async function fetchWarehouses(): Promise<Warehouse[]> {
  return apiGet<Warehouse[]>(API_BASE);
}

async function fetchWarehouse(id: string): Promise<Warehouse> {
  return apiGet<Warehouse>(`${API_BASE}/${id}`);
}

async function createWarehouse(data: WarehouseFormValues): Promise<Warehouse> {
  return apiPost<Warehouse>(API_BASE, data);
}

async function updateWarehouse(
  id: string,
  data: Partial<WarehouseFormValues>,
): Promise<Warehouse> {
  return apiPut<Warehouse>(`${API_BASE}/${id}`, data);
}

async function deleteWarehouse(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/${id}`);
}

export function useWarehouses() {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: fetchWarehouses,
  });
}

export function useWarehouse(id: string) {
  return useQuery({
    queryKey: ["warehouses", id],
    queryFn: () => fetchWarehouse(id),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useUpdateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<WarehouseFormValues>;
    }) => updateWarehouse(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.invalidateQueries({ queryKey: ["warehouses", variables.id] });
    },
  });
}

export function useDeleteWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteWarehouse,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}
