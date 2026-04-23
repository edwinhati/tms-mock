import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { CreateDriverInput, Driver } from "@/types/tms";

const API_BASE = "/api/admin/drivers";

interface DriverWithUser extends Driver {
  phone?: string;
  email?: string;
}

interface CreateDriverResponse {
  success: boolean;
  driver: DriverWithUser;
}

async function fetchDrivers(): Promise<DriverWithUser[]> {
  const res = await apiGet<{ drivers: DriverWithUser[] }>(API_BASE);
  return res.drivers;
}

async function createDriver(
  data: CreateDriverInput,
): Promise<CreateDriverResponse> {
  return apiPost<CreateDriverResponse>(API_BASE, data);
}

async function updateDriver(
  id: string,
  data: Partial<CreateDriverInput>,
): Promise<void> {
  return apiPut<void>(`${API_BASE}/${id}`, data);
}

async function deleteDriver(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/${id}`);
}

export function useDrivers() {
  return useQuery({
    queryKey: ["drivers"],
    queryFn: fetchDrivers,
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateDriverInput>;
    }) => updateDriver(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDriver,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    },
  });
}
