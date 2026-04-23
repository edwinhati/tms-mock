import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost, apiPut } from "@/lib/api/client";
import type { Hub } from "@/types/tms";
import type { HubFormValues } from "@/lib/schemas";

const API_BASE = "/api/hubs";

async function fetchHubs(): Promise<Hub[]> {
  return apiGet<Hub[]>(API_BASE);
}

async function fetchHub(id: string): Promise<Hub> {
  return apiGet<Hub>(`${API_BASE}/${id}`);
}

async function createHub(data: HubFormValues): Promise<Hub> {
  return apiPost<Hub>(API_BASE, data);
}

async function updateHub(
  id: string,
  data: Partial<HubFormValues>,
): Promise<Hub> {
  return apiPut<Hub>(`${API_BASE}/${id}`, data);
}

async function deleteHub(id: string): Promise<void> {
  return apiDelete(`${API_BASE}/${id}`);
}

export function useHubs() {
  return useQuery({
    queryKey: ["hubs"],
    queryFn: fetchHubs,
  });
}

export function useHub(id: string) {
  return useQuery({
    queryKey: ["hubs", id],
    queryFn: () => fetchHub(id),
    enabled: !!id,
  });
}

export function useCreateHub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hubs"] });
    },
  });
}

export function useUpdateHub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<HubFormValues> }) =>
      updateHub(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["hubs"] });
      queryClient.invalidateQueries({ queryKey: ["hubs", variables.id] });
    },
  });
}

export function useDeleteHub() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteHub,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hubs"] });
    },
  });
}
